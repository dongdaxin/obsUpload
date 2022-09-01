import obs from "../index";

const obsPrefix = "";
const obsAccessKey = "";
const obsSecretKey = "";
const obsEndPoint = "";
const obsBucketName = "";

let obsClient = obs.create({
  accessKeyId: obsAccessKey,
  secretAccessKey: obsSecretKey,
  server: obsEndPoint,
  timeout: 60 * 5,
  obsPrefix,
  Bucket: obsBucketName,
});

const file = new Blob(
  Array.from({ length: 102400 }, () => "a"),
  {
    type: "text/plain;charset=utf-8",
  }
);
file.name = "测试上传.txt";
file.lastModifiedDate = new Date();

test("测试文件上传 - 初始化", async () => {
  await expect(
    obs.create({
      accessKeyId: '',
      secretAccessKey: obsSecretKey,
      server: obsEndPoint,
      timeout: 60 * 5,
      obsPrefix,
      Bucket: obsBucketName,
    })
  ).toMatchObject({success: false});
});

test("测试文件上传", async () => {
  await expect(
    obsClient.uploadFile({ sourceFile: file, callback: () => {} })
  ).not.toBe("");
});

test("删除 -- 文件", async () => {
  await expect(
    obsClient.deleteFile('', () => {} )
  ).not.toBe("");
});


test("测试文件上传 -- 是否初始化", async () => {
  await expect(obsClient.isInit()).toBe(true);
});

test("测试文件上传 --> promise", async () => {
  await expect(
    obsClient.uploadFilePromise({ sourceFile: file })
  ).resolves.toMatchObject({ isError: false });
});

test("测试文件上传 --> promise -- 失败", async () => {
  await expect(
    obsClient.uploadFilePromise({ sourceFile: {name: ''} })
  ).rejects.toMatchObject({ isError: true });
});

test("测试切片上传文件上传", async () => {
  await expect(
    obsClient.subsectionUploadFile({ sourceFile: file })
  ).resolves.toMatchObject({ data: {isError: false} });
});


test("测试切片上传文件上传 - 失败", async () => {
  await expect(
    obsClient.subsectionUploadFile({ sourceFile: {name: ''} })
  ).rejects.toMatchObject({ data: {isError: true} });
});