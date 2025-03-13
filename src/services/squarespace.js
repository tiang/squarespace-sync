const axios = require("axios");
const config = require("../config");

class SquarespaceService {
  constructor() {
    this.client = axios.create({
      baseURL: `https://api.squarespace.com/1.0/commerce`,
      headers: {
        Authorization: `Bearer ${config.squarespace.apiKey}`,
        "User-Agent": "Squarespace-Airtable-Sync",
      },
    });
  }

  async getOrders(params = {}) {
    try {
      const response = await this.client.get(`/orders`, {
        params: {
          ...params,
          modifiedAfter: params.modifiedAfter,
          modifiedBefore: params.modifiedBefore,
        },
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Squarespace API error: ${error.response.status} - ${error.response.data.message}`
        );
      }
      throw error;
    }
  }

  async getAllOrders(startDate, endDate) {
    let allOrders = [];
    let cursor = null;

    do {
      const params = cursor
        ? { cursor }
        : {
            modifiedAfter: startDate.toISOString(),
            modifiedBefore: endDate.toISOString(),
          };

      const response = await this.getOrders(params);
      allOrders = allOrders.concat(response.result);
      cursor = response.pagination?.nextPageCursor;
      console.log("cursor", cursor);
    } while (cursor);

    return allOrders;
  }

  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Squarespace API error: ${error.response.status} - ${error.response.data.message}`
        );
      }
      throw error;
    }
  }
}

module.exports = new SquarespaceService();
