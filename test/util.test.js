import * as utils from '../utils/uploadUtil';

const file = new Blob(Array.from({length: 102400}, () => 'a'),{
  type: "text/plain;charset=utf-8",
  lastModifiedDate: new Date(),
  name: "测试上传.txt",
});

test('UUID --> 空字符串', () => {
    expect(utils.generateUUID('')).toBe('');
});

test('UUID --> 非空', () => {
    expect(utils.generateUUID('测试室测试')).not.toBe('');
});

test('文件切片', () => {
    expect(utils.fileDivision(file)).toEqual({uploadPartParams: [{
        Offset: 0,
        PartNumber: 1,
        PartSize: 102400,
        SourceFile: new Blob(),
    }], fileSize: 102400});
});

test('文件切片--切片段多余10000', () => {
    expect(utils.fileDivision(file, 10)).toMatchObject({fileSize: 102400});
});

test('文件切片--切片段多余10000', () => {
    expect(utils.fileDivision(null)).toMatchObject({fileSize: 0});
});

test('测试上传队列', () => {
    const params = utils.fileDivision(file, 10240);
    const uploadFileFun = () => new Promise((res) => res());
    expect(utils.uploadQueue(params.uploadPartParams, uploadFileFun)).resolves.toMatchObject({});
});

test('测试上传队列 - 处理分段数小于并发数', () => {
    const params = utils.fileDivision(file, 102400);
    const uploadFileFun = () => new Promise((res) => res());
    expect(utils.uploadQueue(params.uploadPartParams, uploadFileFun)).resolves.toMatchObject({});
});

