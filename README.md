# AWS DynamoDB Backup

This is a solution to backup AWS DynamoDB table without using PITR and share it across accounts/regions by dumping the file into
an AWS S3 Bucket. The data in the bucket can later be restored in the destination accounts/regions.

## Configuration

You may configure the infra by using the `cdk context` file like the following:

- filename: `cdk.context.json`
- location: root

```json

{
  "default": {
    "tableName": "my-table",
    "buckets": [
      {
        "bucketName": "my-backup-bucket-1",
        "bucketOwner": "123456789012"
      },
      {
        "bucketName": "my-backup-bucket-2",
        "bucketOwner": "123456789013"
      }
    ],
    "backupTtl": 7, // Days
    "backupRate": {
        "type": "days", // Excepted values - 'days' | 'minutes' | 'seconds'
        "value": 1
    }
  },
  "prod": {} // Your environment. It will inherit the `default` props.
}

```

The infra configuration uses a module called [aws-cdk-config-builder](https://www.npmjs.com/package/aws-cdk-config-builder). Checkout for more configuration info.

## Miscellaneous 

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
