# NestJS File Upload

파일 업로드는 **multipart/form-data** + 용량·MIME 검증을 필수입니다.  
저장은 로컬(개발) 또는 **S3 호환 스토리지**(배포)입니다.

```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
# S3
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

---

## 제한 (기본값)

| 항목 | 권장 |
|------|------|
| 최대 크기 | 이미지 5MB, 일반 파일 10MB (프로젝트에서 명시) |
| 허용 MIME | `image/jpeg`, `image/png`, `image/webp` 등 화이트리스트 |
| 필드명 | `file` 또는 `files` (복수는 `FilesInterceptor`) |

```typescript
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
    return cb(new BadRequestException('허용되지 않는 파일 형식입니다') as any, false);
  }
  cb(null, true);
}
```

---

## 컨트롤러

```typescript
@Post('avatar')
@UseGuards(JwtGuard)
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: { file: { type: 'string', format: 'binary' } },
  },
})
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: MAX_IMAGE_BYTES },
    fileFilter: imageFileFilter,
  }),
)
uploadAvatar(
  @UploadedFile() file: Express.Multer.File,
  @User() user: User,
) {
  if (!file) throw new BadRequestException('파일이 필요합니다');
  return this.uploadService.saveAvatar(user.id, file);
}

// 여러 파일 (최대 5개)
@UseInterceptors(
  FilesInterceptor('files', 5, {
    limits: { fileSize: MAX_IMAGE_BYTES },
    fileFilter: imageFileFilter,
  }),
)
```

Swagger는 [`nestjs-swagger.md`](./nestjs-swagger.md)의 `@ApiConsumes` / binary 스키마를 따릅니다.

---

## 저장: 로컬 vs S3

```
STORAGE_DRIVER=local|s3
UPLOAD_DIR=./uploads
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
# 선택: CDN_BASE_URL=
```

```typescript
@Injectable()
export class UploadService {
  async saveAvatar(userId: string, file: Express.Multer.File) {
    const key = `avatars/${userId}/${Date.now()}-${sanitize(file.originalname)}`;

    if (this.config.get('STORAGE_DRIVER') === 's3') {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.config.getOrThrow('AWS_S3_BUCKET'),
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const base =
        this.config.get('CDN_BASE_URL') ||
        `https://${this.config.get('AWS_S3_BUCKET')}.s3.amazonaws.com`;
      return { url: `${base}/${key}`, key };
    }

    const dir = this.config.get('UPLOAD_DIR') || './uploads';
    await fs.mkdir(dir, { recursive: true });
    const path = `${dir}/${key.replace(/\//g, '_')}`;
    await fs.writeFile(path, file.buffer);
    return { url: `/static/${key}`, key };
  }
}
```

| | local | S3 |
|---|--------|-----|
| 용도 | 로컬 개발 | 스테이징/프로덕션 |
| Multer | `memoryStorage()` 권장 | `memoryStorage` → SDK 업로드 |
| URL | 정적 서빙 `/static` | S3 / CloudFront |

프로덕션에서 앱 디스크에만 영구 저장하지 않습니다.

```typescript
MulterModule.register({ storage: memoryStorage() });
```

---

## 보안

- 확장자만 믿지 말고 **MIME + 크기** 검증
- 파일명 sanitize (경로 traversal 방지)
- 업로드는 인증(`JwtGuard`) 기본
- 실행 가능 파일·HTML 업로드 금지

---

## 규칙

### DO
- multipart + limits + fileFilter
- `STORAGE_DRIVER`로 local/S3 분기
- 키에 유저/도메인 접두사 (`avatars/`, `books/`)

### DON'T
- 무제한 크기·모든 MIME 허용
- 프로덕션에 로컬 디스크만 사용
- 원본 `originalname`을 경로에 그대로 사용
