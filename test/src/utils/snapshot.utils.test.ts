import * as cut from "./../../../src/utils/snapshot.utils";

describe("snapshot.utils generateBackupName()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a generated snapshot name prefix with date hash", () => {
    const now = new Date(1685417086355);

    jest.spyOn(Date, "now").mockImplementation(() => {
      return now.getTime();
    });

    const result = cut.generateBackupName("mock-table");

    expect(result).toBe("mock-table-snapshot-1685417086355");
  });
});

describe("snapshot.utils isSnapshotOverTtl()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if snapshotName does not follow standard", () => {
    const date = new Date(1685417086355);
    date.setDate(date.getDate() - 2);

    jest.spyOn(Date, "now").mockImplementationOnce(() => {
      return date.getTime();
    });

    try {
      cut.isSnapshotOverTtl("mock-table-snapshot", 1);
    } catch (ex) {
      expect(ex).toThrowError();
    }
  });

  it("should return true if the ttl value is exceeded", () => {
    const date = new Date(1685417086355);
    date.setDate(date.getDate() + 2);

    jest.spyOn(Date, "now").mockImplementationOnce(() => {
      return date.getTime();
    });

    const result = cut.isSnapshotOverTtl(
      "mock-table-snapshot-1685417086355",
      1
    );

    expect(result).toBe(true);
  });

  it("should return false if the ttl value has not exceed", () => {
    const date = new Date(1685417086355);
    date.setDate(date.getDate() - 2);

    jest.spyOn(Date, "now").mockImplementationOnce(() => {
      return date.getTime();
    });

    const result = cut.isSnapshotOverTtl(
      "mock-table-snapshot-1685417086355",
      1
    );

    expect(result).toBe(false);
  });
});

describe("snapshot.utils getBucketNameFromStr()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return array of bucket names from bucket name string concat", () => {
    const result = cut.getBucketNameFromStr("bucket1, bucket2, bucket3");

    expect(result).toEqual(["bucket1", "bucket2", "bucket3"]);
  });

  it("should return array of bucket names from bucket name string concat", () => {
    const result = cut.getBucketNameFromStr("bucket1");

    expect(result).toEqual(["bucket1"]);
  });
});

describe("snapshot.utils getBucketOwnerFromStr()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return array of bucket owners from bucket owner string concat", () => {
    const result = cut.getBucketOwnerFromStr(
      "100000000, 1000000001, 1000000002"
    );

    expect(result).toEqual(["100000000", "1000000001", "1000000002"]);
  });
});
