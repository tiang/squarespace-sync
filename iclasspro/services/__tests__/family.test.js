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
          id: 664,
          name: "Test Family",
          email: "test@example.com",
          phone: "1234567890",
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
        data: { id: 664, name: "Family 1" },
      };
      const mockResponse2 = {
        data: { id: 665, name: "Family 2" },
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
        data: { id: 664, name: "Family 1" },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamilies([664, 664, 664]);

      expect(mockClient.get).toHaveBeenCalledTimes(1); // Only called once
      expect(result).toHaveLength(1);
    });

    it("should filter out null/undefined IDs", async () => {
      const mockResponse = {
        data: { id: 664, name: "Family 1" },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamilies([664, null, undefined]);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it("should continue on individual failures", async () => {
      const mockResponse1 = {
        data: { id: 664, name: "Family 1" },
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
