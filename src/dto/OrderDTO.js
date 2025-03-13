class OrderDTO {
  // Define the mapping of custom field labels to standardized field names
  static CUSTOM_FIELD_MAPPING = {
    "Child's name": "student_name",
    "Student Name": "student_name",
    "Student name": "student_name",
    "Student's Name": "student_name",
    "Child's age": "student_age",
    "Student Age": "student_age",
    "Student age": "student_age",
    "School Year": "school_year",
    "School year": "school_year",
    "Parent/ Carer's Name": "parent_name",
    "Parent Name": "parent_name",
    "Parents/ Carer's Name": "parent_name",
    "Parents/ Carer's Name *": "parent_name",
    "Parent/ Carer's Mobile": "parent_mobile",
    "Parent/ Carer's contact number": "parent_mobile",
    "Parents/ Carer's Mobile number": "parent_mobile",
    "Parents/ Carer's Contact": "parent_mobile",
    "Photo Permission": "photo_permission",
    "Photography Permission": "photo_permission",
    "We occasionally take and share photos from our classes on our social media accounts. Do you consent to your child's photos being included?":
      "photo_permission",
    "Referral Source": "referral_source",
    "How did you hear about us?": "referral_source",
    "Medical Conditions": "medical_conditions",
    "Does the student has any allergy or medical conditions?":
      "medical_conditions",
    "Any medical conditions?": "medical_conditions",
    "Additional Notes": "additional_notes",
    "Is there anything else we should know about?": "additional_notes",
    Notes: "additional_notes",
  };

  // Helper method to extract customization values
  static extractCustomizations(order) {
    if (!order.lineItems || !Array.isArray(order.lineItems)) {
      return {};
    }

    // Initialize all fields as null
    const customFields = {
      student_name: null,
      student_age: null,
      school_year: null,
      parent_name: null,
      parent_mobile: null,
      photo_permission: null,
      referral_source: null,
      medical_conditions: null,
      additional_notes: null,
    };

    // Iterate through each line item
    order.lineItems.forEach((item) => {
      if (item.customizations && Array.isArray(item.customizations)) {
        item.customizations.forEach((customization) => {
          const label = customization.label || "";
          const value = customization.value || "";

          // Check if this label maps to one of our desired fields
          const standardFieldName = this.CUSTOM_FIELD_MAPPING[label];

          if (standardFieldName) {
            // Special handling for specific fields
            switch (standardFieldName) {
              case "student_age":
                // Try to extract just the number
                const age = parseInt(value.match(/\d+/)?.[0] || "");
                customFields[standardFieldName] = isNaN(age) ? value : age;
                break;

              case "photo_permission":
                // Normalize photo permission to Yes/No
                const normalizedValue = value.toLowerCase();
                customFields[standardFieldName] =
                  normalizedValue.includes("yes") ||
                  normalizedValue.includes("true")
                    ? "Yes"
                    : normalizedValue.includes("no") ||
                      normalizedValue.includes("false")
                    ? "No"
                    : value;
                break;

              case "parent_mobile":
                // Clean up phone number format
                customFields[standardFieldName] = value.replace(/[^\d+]/g, "");
                // Format phone number as xxxx xxx xxx
                const digits = value.replace(/[^\d]/g, "");
                if (digits.length === 10) {
                  customFields[standardFieldName] = `${digits.slice(
                    0,
                    4
                  )} ${digits.slice(4, 7)} ${digits.slice(7)}`;
                } else {
                  customFields[standardFieldName] = value; // Keep original if not 10 digits
                }
                break;

              default:
                customFields[standardFieldName] = value;
            }
          }
        });
      }
    });

    return customFields;
  }

  static toAirtableFields(order) {
    // Get customization fields
    const customFields = this.extractCustomizations(order);

    // Extract product details from the first line item
    const firstItem = order.lineItems?.[0] || {};
    const productDetails = {
      "Product Name": firstItem.productName || null,
      SKU: firstItem.sku || null,
      "Product ID": firstItem.productId || null,
      "Variant ID": firstItem.variantId || null,
    };

    // Base fields
    const baseFields = {
      "Order ID": order.id,
      "Order Number": order.orderNumber,
      "Created Date": order.createdOn,
      "Modified Date": order.modifiedOn,
      Status: order.fulfillmentStatus,
      "Customer Email": order.customerEmail,
      Total: parseInt(order.grandTotal.value),
      Currency: order.grandTotal.currency,
      Items: JSON.stringify(order.lineItems),
      "Shipping Address": JSON.stringify(order.shippingAddress),
      "Billing Address": JSON.stringify(order.billingAddress),
      "Product Name": productDetails["Product Name"],
      SKU: productDetails["SKU"],
      "Product ID": productDetails["Product ID"],
      "Variant ID": productDetails["Variant ID"],
      // Map custom fields to Airtable fields with proper naming
      "Student Name": customFields.student_name,
      "Student Age": customFields.student_age,
      "School Year": customFields.school_year,
      "Contact Name": customFields.parent_name,
      "Contact Mobile": customFields.parent_mobile,
      "Photo Permission": customFields.photo_permission,
      "Referral Source": customFields.referral_source,
      "Medical Conditions": customFields.medical_conditions,
      "Additional Notes": customFields.additional_notes,
      // Store raw customizations for reference
      "Raw Customisations": JSON.stringify(
        order.lineItems
          ?.map((item) => item.customizations)
          .filter(Boolean)
          .flat()
      ),
    };

    return baseFields;
  }

  static fromAirtableRecord(record) {
    if (!record) return null;

    const customFields = {
      student_name: record.get("Student Name"),
      student_age: record.get("Student Age"),
      school_year: record.get("School Year"),
      parent_name: record.get("Parent/Carer Name"),
      parent_mobile: record.get("Parent/Carer Mobile"),
      photo_permission: record.get("Photo Permission"),
      referral_source: record.get("Referral Source"),
      medical_conditions: record.get("Medical Conditions"),
      additional_notes: record.get("Additional Notes"),
    };

    return {
      id: record.get("Order ID"),
      orderNumber: record.get("Order Number"),
      fulfillmentStatus: record.get("Status"),
      customerEmail: record.get("Customer Email"),
      grandTotal: {
        value: record.get("Total"),
        currency: record.get("Currency"),
      },
      lineItems: JSON.parse(record.get("Items") || "[]"),
      shippingAddress: JSON.parse(record.get("Shipping Address") || "null"),
      billingAddress: JSON.parse(record.get("Billing Address") || "null"),
      customFields: customFields,
      rawCustomizations: JSON.parse(record.get("Raw Customizations") || "[]"),
    };
  }

  // Helper method to validate required fields
  static validateOrder(order) {
    const requiredFields = ["id", "orderNumber", "grandTotal"];
    const missingFields = requiredFields.filter((field) => !order[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
  }
}

module.exports = OrderDTO;
