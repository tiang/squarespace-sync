const FamilyService = require("../family");
const FamilyMapper = require("../../mappers/FamilyMapper");
const FamilyDTO = require("../../dto/FamilyDTO");

describe("FamilyService", () => {
  let service;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
    };
    service = new FamilyService(mockClient);
  });

  describe("getFamily", () => {
    it("should fetch and transform a single family", async () => {
      const mockResponse = {
        data: {
          data: {
            id: 664,
            guardians: [
              {
                id: 1234,
                firstName: "John",
                lastName: "Smith",
                isPrimary: true,
                relationshipId: 1,
              },
            ],
            emails: [
              {
                email: "john.smith@example.com",
                isPrimary: true,
                guardianId: 1234,
              },
            ],
            phones: [
              {
                phoneSearch: "1234567890",
                isPrimary: true,
                guardianId: 1234,
              },
            ],
            addresses: [
              {
                street1: "123 Main St",
                street2: "",
                city: "Singapore",
                state: "SG",
                zip: "123456",
                isPrimary: true,
              },
            ],
          },
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamily(664);

      expect(mockClient.get).toHaveBeenCalledWith("/family/664");
      expect(result).toBeInstanceOf(FamilyDTO);
      expect(result.familyId).toBe(664);
    });

    it("should throw error if API call fails", async () => {
      mockClient.get.mockRejectedValue(new Error("API Error"));

      await expect(service.getFamily(664)).rejects.toThrow(
        "Failed to fetch family 664"
      );
    });
  });

  describe("getFamilies", () => {
    it("should fetch multiple families in parallel", async () => {
      const mockResponse1 = {
        data: {
          data: {
            id: 664,
            guardians: [
              {
                id: 1234,
                firstName: "John",
                lastName: "Smith",
                isPrimary: true,
                relationshipId: 1,
              },
            ],
            emails: [
              {
                email: "john.smith@example.com",
                isPrimary: true,
                guardianId: 1234,
              },
            ],
            phones: [
              {
                phoneSearch: "1234567890",
                isPrimary: true,
                guardianId: 1234,
              },
            ],
            addresses: [],
          },
        },
      };
      const mockResponse2 = {
        data: {
          data: {
            id: 665,
            guardians: [
              {
                id: 5678,
                firstName: "Jane",
                lastName: "Doe",
                isPrimary: true,
                relationshipId: 1,
              },
            ],
            emails: [
              {
                email: "jane.doe@example.com",
                isPrimary: true,
                guardianId: 5678,
              },
            ],
            phones: [
              {
                phoneSearch: "0987654321",
                isPrimary: true,
                guardianId: 5678,
              },
            ],
            addresses: [],
          },
        },
      };

      mockClient.get
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const result = await service.getFamilies([664, 665]);

      expect(mockClient.get).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].familyId).toBe(664);
      expect(result[1].familyId).toBe(665);
    });

    it("should deduplicate family IDs", async () => {
      const mockResponse = {
        data: {
          data: {
            id: 664,
            guardians: [
              {
                id: 1234,
                firstName: "John",
                lastName: "Smith",
                isPrimary: true,
                relationshipId: 1,
              },
            ],
            emails: [],
            phones: [],
            addresses: [],
          },
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamilies([664, 664, 664]);

      expect(mockClient.get).toHaveBeenCalledTimes(1); // Only called once
      expect(result).toHaveLength(1);
    });

    it("should filter out null/undefined IDs", async () => {
      const mockResponse = {
        data: {
          data: {
            id: 664,
            guardians: [
              {
                id: 1234,
                firstName: "John",
                lastName: "Smith",
                isPrimary: true,
                relationshipId: 1,
              },
            ],
            emails: [],
            phones: [],
            addresses: [],
          },
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamilies([664, null, undefined]);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it("should continue on individual failures", async () => {
      const mockResponse1 = {
        data: {
          data: {
            id: 664,
            guardians: [
              {
                id: 1234,
                firstName: "John",
                lastName: "Smith",
                isPrimary: true,
                relationshipId: 1,
              },
            ],
            emails: [],
            phones: [],
            addresses: [],
          },
        },
      };

      mockClient.get
        .mockResolvedValueOnce(mockResponse1)
        .mockRejectedValueOnce(new Error("API Error"));

      const result = await service.getFamilies([664, 665]);

      // Should return successful fetches, null for failures
      expect(result).toHaveLength(2);
      expect(result[0].familyId).toBe(664);
      expect(result[1]).toBeNull();
    });
  });
});
