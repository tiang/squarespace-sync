const Airtable = require("airtable");
const config = require("../config");
const OrderDTO = require("../dto/OrderDTO");

class AirtableService {
  constructor() {
    this.base = new Airtable({ apiKey: config.airtable.apiKey }).base(
      config.airtable.baseId
    );
    this.table = this.base(config.airtable.tableName);
  }

  async findOrderById(orderId) {
    try {
      const records = await this.table
        .select({
          filterByFormula: `{Order ID} = '${orderId}'`,
          maxRecords: 1,
        })
        .firstPage();

      return records[0];
    } catch (error) {
      throw new Error(`Airtable find error: ${error.message}`);
    }
  }

  async upsertOrder(order) {
    try {
      // Validate order data
      //   OrderDTO.validateOrder(order);

      const existingRecord = await this.findOrderById(order.id);
      const fields = OrderDTO.toAirtableFields(order);

      if (existingRecord) {
        // Update existing record
        return await this.table.update(existingRecord.id, fields);
      } else {
        // Create new record
        return await this.table.create(fields);
      }
    } catch (error) {
      throw new Error(
        `Airtable upsert error for order ${order.id}: ${error.message}`
      );
    }
  }

  async bulkUpsertOrders(orders) {
    const results = [];
    // Process orders in chunks of 10 concurrent requests
    const chunkSize = 10;
    const chunks = [];

    // Split orders into chunks
    for (let i = 0; i < orders.length; i += chunkSize) {
      chunks.push(orders.slice(i, i + chunkSize));
    }

    // Process each chunk concurrently
    for (const chunk of chunks) {
      const promises = chunk.map(async (order) => {
        try {
          const result = await this.upsertOrder(order);
          return { success: true, order: order.id, record: result };
        } catch (error) {
          return { success: false, order: order.id, error: error.message };
        }
      });

      // Wait for all promises in chunk to resolve
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }
    return results;
  }

  // Helper method to get an order with full data
  async getOrder(orderId) {
    const record = await this.findOrderById(orderId);
    return OrderDTO.fromAirtableRecord(record);
  }
}

module.exports = new AirtableService();
