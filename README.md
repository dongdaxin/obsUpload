## Obs  上传文件工具

* npm run up       上传到npm
* npm run test     单元测试
* npm run build    打包
* npm run version  修改版本

### 目录

├─ index.ts 主要逻辑
├─ utils
│  └─ index.ts 工具 切片 并发处理
### 初始化

```
    import obs from '@sunField/obs-subsection-upload'

    const obsPrefix = ''
    const obsAccessKey = ''
    const obsSecretKey = ''
    const obsEndPoint = ''
    const obsBucketName = ''

    const obsClient = obs.create({
        accessKeyId: obsAccessKey,
        secretAccessKey: obsSecretKey,
        server: obsEndPoint,
        timeout: 60 * 5,
        obsPrefix,
        Bucket: obsBucketName
    })
```

---
### 文件上传
```
obsClient.uploadFile({
    sourceFile, // 上传的文件 必传
    callback, // 回调
    keyPrefix, // 文件保存位置
    param = {}, // 其他obs上参数
})
```
---
### 文件上传 异步
```
obsClient.uploadFilePromise({
    sourceFile, // 上传的文件 必传
    keyPrefix, // 文件保存位置
    param = {}, // 其他obs上参数
})
```
---
### 删除文件
```
obsClient.deleteFile(
    key, // 要删除的key
    callback, // 回调函数
)
```
---
### 切片上传 异步
```
obsClient.subsectionUploadFile({
    sourceFile, // 上传的文件 必传
    keyPrefix, // 文件保存位置
    param = {}, // 其他obs上参数
    partSize = 102400, // 切每段大小  支持最大10000段 超过10000段会自动调整
    limit = 5, // 上传并发数
    progress = () => {}, // 上传进度
})
```

