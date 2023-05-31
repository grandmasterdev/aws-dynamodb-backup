import { CloudWatchLogsEvent, Context } from "aws-lambda";
import {
  DescribeTableCommand,
  DynamoDBClient,
  DynamoDB,
  ExportTableToPointInTimeCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  getBucketNameFromStr, getBucketOwnerFromStr,
} from "../../utils/snapshot.utils";

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAMES = process.env.BUCKET_NAMES;
const BUCKET_OWNERS = process.env.BUCKET_OWNERS;

const db = new DynamoDB({});
const dbc = new DynamoDBClient({})

export const shareSnapshot = async (
  event: CloudWatchLogsEvent,
  context: Context
) => {
  if (!TABLE_NAME) {
    throw new Error(`[shareSnapshot] missing table name constant value`);
  }

  const describeCommand = new DescribeTableCommand({
    TableName: TABLE_NAME
  });

  const tableDetail = await dbc.send(describeCommand);

  if(!tableDetail) {
    throw new Error(`[shareSnapshot] missing table detail`);
  }

  if(!tableDetail.Table) {
    throw new Error(`[shareSnapshot] missing table detail table`)
  }

  const bucketNames = getBucketNameFromStr(BUCKET_NAMES ?? "");
  const bucketOwners = getBucketOwnerFromStr(BUCKET_OWNERS ?? "");

  try {
    for (let i = 0; i < bucketNames.length - 1; i++) {
      if (!bucketNames[i]) {
        break;
      }

      const params: ExportTableToPointInTimeCommandInput = {
        TableArn: tableDetail.Table.TableArn,
        S3Bucket: bucketNames[i],
        S3BucketOwner: bucketOwners[i],
        S3Prefix: "carwash-voucher-db",
        ExportFormat: "DYNAMODB_JSON"
      };

      const data = await db.exportTableToPointInTime(params);

      if (!data) {
        throw new Error(`[shareSnapshot] missing data`);
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};
