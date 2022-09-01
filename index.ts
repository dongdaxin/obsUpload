import ObsClient from "esdk-obs-browserjs";
import { generateUUID, fileDivision, uploadQueue } from "./utils/uploadUtil";
class ObsSubsectionUpload {
  constructor(Bucket = "", obsPrefix="") {
    this.Bucket = Bucket;
    this.obsPrefix = obsPrefix;
  }
  Bucket = "";
  obsPrefix = "";
  // obs 实例
  obsClient: any = {};
  // 初始化
  init(data) {
    this.obsClient = new ObsClient({
      access_key_id: data.accessKeyId,
      secret_access_key: data.secretAccessKey,
      server: data.server,
      timeout: data.timeout || 60 * 5,
      is_cname: data.isCname || false,
      useRawXhr: data.useRawXhr || false,
    });
  }
  // 是否初始化
  isInit() {
    return Object.keys(this.obsClient).length !== 0;
  }
  // 文件上传
  uploadFile({
    sourceFile,
    callback,
    keyPrefix = "createver/headlineFiles/",
    param = {}
  }) {
    const Key = keyPrefix + generateUUID(sourceFile.name);
    const _this = this;
    this.obsClient.putObject(
      {
        Bucket: _this.Bucket,
        Key,
        SourceFile: sourceFile,
        ...param,
      },
      function (err, result) {
        callback &&
        callback({
            url: _this.obsPrefix + "/" + Key,
            isError: !!err || result.CommonMsg.Status !== 200,
            result,
          });
      }
    );
  }

  // 文件上传 promise
  uploadFilePromise({
    sourceFile,
    keyPrefix = "createver/headlineFiles/",
    param = {}
  }) {
    const Key = keyPrefix + generateUUID(sourceFile.name);
    const _this = this;
    return new Promise((resolve, reject) => {
      this.obsClient.putObject(
        {
          Bucket: _this.Bucket,
          Key,
          SourceFile: sourceFile,
          ...param,
        },
        function (err, result) {
          if (err || result.CommonMsg.Status !== 200) {
            return reject({
              isError: !!err,
              err,
              result,
            });
          } else {
            return resolve({
              rul: _this.obsPrefix + "/" + Key,
              result,
              isError: !!err,
            });
          }
        }
      );
    });
  }

  // 删除文件
  deleteFile(Key, callback) {
    this.obsClient.deleteObject(
      {
        Bucket: this.Bucket,
        Key,
      },
      function (err, result) {
        callback &&
          callback({
            isError: !!err,
            err,
            result,
          });
      }
    );
  }

  // 切片上传
  subsectionUploadFile({
    sourceFile,
    keyPrefix = "createver/headlineFiles/",
    param = {},
    partSize = 102400,
    limit = 5,
    progress = () => {},
  }) {
    const Key = keyPrefix + generateUUID(sourceFile.name);
    const _this = this;
    return new Promise((resolve, reject) => {
      this.obsClient.initiateMultipartUpload(
        {
          Bucket: this.Bucket,
          Key,
          ContentType: "text/plain",
          Metadata: { property: "property-value" },
          ...param,
        },
        (err, result) => {
          if (
            err ||
            result.CommonMsg.Status !== 200 ||
            !result.InterfaceResult
          ) {
            reject({
              isError: true,
              err,
              result,
            });
          } else {
            const UploadId = result.InterfaceResult.UploadId;
            // 切片
            const partParams = fileDivision(sourceFile, partSize, {
              UploadId,
              Bucket: _this.Bucket,
              Key,
            });
            const uploadPartParams = partParams.uploadPartParams;
            const fileSize = partParams.fileSize;
            const partCount = uploadPartParams.length;
            const otherUploadPartInfo = { fileSize, partCount };
            // 调用并行上传函数
            uploadQueue(
              uploadPartParams,
              (param) => _this.uploadPart(param, otherUploadPartInfo, progress),
              limit
            )
              .then(() => {
                _this.combinePre(Key, UploadId).then((data) => {
                  return resolve({
                    rul: _this.obsPrefix + "/" + Key,
                    data,
                  });
                });
              })
              .catch((err) => {
                reject(err);
              });
          }
        }
      );
    });
  }

  // 段上传
  /**
   * uploadSuccessSize：已经上传成功的大小
   * uploadSuccessCount：已经上传成功的段数量
   * concurrency：当前并发数
   */
  uploadSuccessSize = 0;
  uploadSuccessCount = 0;
  concurrency = 0;
  parts: any = [];
  uploadPart(uploadPartParam, otherUploadPartInfo, progress = (v?) => {}) {
    const partCount = otherUploadPartInfo.partCount;
    const fileSize = otherUploadPartInfo.fileSize;
    this.concurrency++;
    return this.obsClient
      .uploadPart(uploadPartParam)
      .then((result) => {
        const { PartNumber, PartSize } = uploadPartParam;
        if (result.CommonMsg.Status === 200) {
          this.uploadSuccessCount++;
          this.uploadSuccessSize += PartSize;
          progress &&
            progress({
              concurrency: this.concurrency,
              partCount,
              uploadSuccessCount: this.uploadSuccessCount,
              successNumber: PartNumber,
              fileSize,
              uploadSuccessSize: this.uploadSuccessSize,
              percentage:
                ((this.uploadSuccessSize / fileSize) * 100).toFixed(2),
            });
          this.parts.push({ PartNumber, ETag: result.InterfaceResult.ETag });
        } else {
          return Promise.reject(result);
        }
        this.concurrency--;
      })
      .catch(function (err) {
        throw err;
      });
  }

  // 合并 段
  combinePre(Key, UploadId) {
    return new Promise((resolve, reject) => {
      this.obsClient.completeMultipartUpload(
        {
          Bucket: this.Bucket,
          Key,
          UploadId,
          Parts: this.parts.sort((a, b) => a.PartNumber - b.PartNumber),
        },
        (err, result) => {
          if (err || result.CommonMsg.Status !== 200) {
            reject({
              isError: true,
              err,
              result,
            });
          } else {
            resolve({
              isError: false,
              result,
            });
          }
        }
      );
    });
  }
}

/**
 * 初始化
 */
interface createData {
  Bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  server: string;
  timeout: number;
  obsPrefix: string;
}
function create(data: createData) {
  if (
    !data.Bucket ||
    !data.accessKeyId ||
    !data.obsPrefix ||
    !data.secretAccessKey ||
    !data.server
  ) {
    return {
      success: false,
      message: '缺少初始化参数'
    }
  }
  const obs = new ObsSubsectionUpload(data.Bucket, data.obsPrefix);
  obs.init(data);
  return obs;
}

export default { create };
