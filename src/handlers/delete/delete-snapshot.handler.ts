import { CloudWatchLogsEvent, Context } from "aws-lambda";
import {
  BackupSummary,
  DeleteBackupCommand,
  DynamoDBClient,
  ListBackupsCommand,
  ListBackupsCommandInput,
} from "@aws-sdk/client-dynamodb";
import { isBackNameLegit, isSnapshotOverTtl } from "../../utils/snapshot.utils";

const TABLE_NAME = process.env.TABLE_NAME;
const BACKUP_TTL = process.env.BACKUP_TTL;

const dbc = new DynamoDBClient({});

export const deleteSnapshot = async (
  event: CloudWatchLogsEvent,
  context: Context
) => {
  if (!TABLE_NAME) {
    throw new Error(`[deleteSnapshot] missing table name constant value`);
  }

  if (!BACKUP_TTL) {
    throw new Error(`[deleteSnapshot] missing TTL constant value`);
  }

  const params: ListBackupsCommandInput = {
    TableName: TABLE_NAME,
  };

  const command = new ListBackupsCommand(params);

  try {
    const data = await dbc.send(command);

    if (!data) {
      throw new Error(`[deleteSnapshot] missing data`);
    }

    if (!data.BackupSummaries) {
      throw new Error(`[deleteSnapshot] missing BackupSummaries`);
    }

    const backupToDelete: BackupSummary[] = [];

    data.BackupSummaries.forEach((summary) => {
      if (isBackNameLegit(summary.BackupName ?? "")) {
        if (isSnapshotOverTtl(summary.BackupName ?? "", parseInt(BACKUP_TTL))) {
          backupToDelete.push(summary);
        }
      }
    });

    for (let i = 0; i < backupToDelete.length - 1; i++) {
      const params = {
        BackupArn: backupToDelete[i].BackupArn,
      };

      const command = new DeleteBackupCommand(params);

      try {
        await dbc.send(command);
      } catch (err) {
        console.error(err);
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};
