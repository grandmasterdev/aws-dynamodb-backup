const regexStr = /^[0-9a-zA-Z]|-{0,}-snapshot-[0-9]{0,}$/g;

export const generateBackupName = (tableName: string) => {
  const date = Date.now();

  return `${tableName}-snapshot-${date}`;
};

export const isSnapshotOverTtl = (snapshotName: string, ttlInDays: number) => {
  const regex = new RegExp(regexStr);

  if (!regex.test(snapshotName)) {
    throw new Error(
      `[isSnapshotOverTtl] snapshot name does not follow naming standard`
    );
  }

  const strParts = snapshotName.split("-");
  const dateVal = parseInt(strParts[strParts.length - 1]);

  const currentDate = Date.now();
  const date = new Date(dateVal);
  const snapshotDate = date.getTime();

  const different = currentDate - snapshotDate;
  const diffInDays = different / (1000 * 60 * 60 * 24);

  if(diffInDays >= ttlInDays) {
    return true;
  }

  return false;
};

export const isBackNameLegit = (backupName: string) => {
    if(!backupName) {
        throw new Error(`[isBackupNameLegit] missing backup name`)
    }

    const regex = new RegExp(regexStr);

    return regex.test(backupName);
}

export const getBucketNameFromStr = (bucketNames: string) => {
    const names = bucketNames.split(',');

    names.forEach((name, index)=>{
        names[index] = name.replace(/ /g, '');
    });

    return names;
}

export const getBucketOwnerFromStr = (bucketOwners: string) => {
  const owners = bucketOwners.split(',');

  owners.forEach((owner, index)=>{
    owners[index] = owner.replace(/ /g, '');
  });

  return owners;
}
