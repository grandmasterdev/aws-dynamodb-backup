import { CloudWatchLogsEvent, Context } from "aws-lambda";
import { DynamoDBClient, CreateBackupCommand } from '@aws-sdk/client-dynamodb';
import {generateBackupName} from '../../utils/snapshot.utils';

const TABLE_NAME = process.env.TABLE_NAME;

const dbc = new DynamoDBClient({});

export const createSnapshot = async (event: CloudWatchLogsEvent, context: Context) => {
    if(!TABLE_NAME) {
        throw new Error(`[createSnapshot] missing table name constant value`)
    }

    const backupName = generateBackupName(TABLE_NAME);

    const params = {
        BackupName: backupName,
        TableName: TABLE_NAME
    }

    const command = new CreateBackupCommand(params);

    try {
        const data = await dbc.send(command);

        console.log("Backup created successfully", data);
    } catch(err) {
        console.error(err);
        throw err;
    }
};
