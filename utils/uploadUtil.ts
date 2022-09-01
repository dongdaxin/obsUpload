// 生成uuid
export function generateUUID(fileName) {
  if (!fileName) return "";
  var d = new Date().getTime();
  if (window.performance && typeof window.performance.now === "function") {
    d += performance.now(); //use high-precision timer if available
  }
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    }
  );

  return uuid + fileName.substring(fileName.lastIndexOf("."));
}

// 文件切片
export function fileDivision(
  file: File,
  partSize: number = 102400,
  param = {}
) {
  if (!file) return { uploadPartParams: [], fileSize: 0 };
  const fileSize = file.size;
  const divisionNum = Math.floor(fileSize / partSize);
  // obs 支持最大 分段数 10000
  if (divisionNum > 10000) {
    const partSizeMax = fileSize / 9999;
    return fileDivision(file, partSizeMax, param);
  }
  const partCount = fileSize % partSize === 0 ? divisionNum : divisionNum + 1;
  const uploadPartParams: any = [];
  for (let i = 0; i < partCount; i++) {
    const Offset = i * partSize;
    const PartNumber = i + 1;
    const currPartSize =
      PartNumber === partCount ? fileSize - Offset : partSize;
    uploadPartParams.push({
      PartNumber,
      Offset,
      SourceFile: file,
      PartSize: currPartSize,
      ...param,
    });
  }
  return { uploadPartParams, fileSize };
}

// 处理上传队列
export function uploadQueue(
  params,
  uploadFileFun,
  limit = 5,
  progress = () => {}
) {
  return new Promise((resolve) => {
    let concurrency = 0;
    let finished = 0;
    const count = params.length;
    if (count < limit) {
      limit = count;
    }
    // 上传方法
    const run = (param) => {
      concurrency++;
      uploadFileFun(param).then(() => {
        finished++;
        if (finished === count) {
          resolve({});
          return;
        }
        concurrency--;
        drainQueue();
      });
    };
    // 队列方法
    const drainQueue = () => {
      while (count && concurrency < limit) {
        if (!params.length) break;
        const param = params.shift();
        param && run(param);
      }
    };
    drainQueue();
  });
}
