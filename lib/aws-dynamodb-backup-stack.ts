import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Code, Function, FunctionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Role,
  PolicyStatement,
  Effect,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { SfnStateMachine } from "aws-cdk-lib/aws-events-targets";
import builder from "aws-cdk-config-builder";

export class AwsDynamodbBackupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = builder
      .getInstance(this)
      .build<CdkConfig>(
        this.node.tryGetContext("environment") ?? "default"
      ) as CdkConfig;

    /**
     * Lambdas
     */
    const lambdaRole = new Role(this, `lambda-role`, {
      description: "aws dynamodb backup role",
      roleName: "aws-dynamodb-backup",
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:*", "cloudwatch:*", "logs:*"],
        resources: ["*"],
      })
    );

    const defaultFunctionProps: Partial<FunctionProps> = {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        TABLE_NAME: config.tableName,
        BACKUP_TTL: config.backupTtl.toString(),
        BUCKET_NAMES: this.parseBucketNamesToStr(config.buckets),
        BUCKET_OWNERS: this.parseBucketOwnerToStr(config.buckets),
      },
    };

    const createSnapshotFn = new Function(this, `create-snapshot-function`, {
      ...(defaultFunctionProps as FunctionProps),
      handler: "create-snapshot.handler.create-snapshot",
      code: Code.fromAsset("dist/create"),
      functionName: 'dynamodb-create-snapshot'
    });

    const deleteSnapshotFn = new Function(this, `delete-snapshot-function`, {
      ...(defaultFunctionProps as FunctionProps),
      handler: "delete-snapshot.handler.delete-snapshot",
      code: Code.fromAsset("dist/delete"),
      functionName: 'dynamodb-delete-snapshot'
    });

    const shareSnapshotFn = new Function(this, `share-snapshot-function`, {
      ...(defaultFunctionProps as FunctionProps),
      handler: "share-snapshot.handler.share-snapshot",
      code: Code.fromAsset("dist/share"),
      functionName: 'dynamodb-share-snapshot'
    });

    /**
     * Step function
     */
    const dynamodbBackupStateMachine = new StateMachine(this, "step-function", {
      stateMachineName: "aws-dynamodb-backup",
      definition: new LambdaInvoke(this, `create-snapshot-state`, {
        lambdaFunction: createSnapshotFn,
      }).next(
        new LambdaInvoke(this, `share-snapshot-state`, {
          lambdaFunction: shareSnapshotFn,
        }).next(
          new LambdaInvoke(this, `delete-snapshot-state`, {
            lambdaFunction: deleteSnapshotFn,
          })
        )
      ),
    });

    /**
     * Cloudwatch event
     */
    const rule = new Rule(this, "Rule", {
      schedule: Schedule.rate(cdk.Duration.days(1)),
    });

    rule.addTarget(new SfnStateMachine(dynamodbBackupStateMachine));
  }

  private parseBucketNamesToStr(buckets: BucketProps[]) {
    let bucketNames = "";

    buckets.forEach((bucket) => {
      if (bucketNames === "") {
        bucketNames += bucket.bucketName;
      } else {
        bucketNames += `,${bucket.bucketName}`;
      }
    });

    return bucketNames;
  }

  private parseBucketOwnerToStr(buckets: BucketProps[]) {
    let bucketOwners = "";

    buckets.forEach((bucket) => {
      if (bucketOwners === "") {
        bucketOwners += bucket.bucketOwner;
      } else {
        bucketOwners += `,${bucket.bucketOwner}`;
      }
    });

    return bucketOwners;
  }
}

export type CdkConfig = {
  tableName: string;
  buckets: BucketProps[];
  backupTtl: number;
};

export type BucketProps = {
  bucketName: string;
  bucketOwner: string;
};
