import { existsSync, mkdirSync } from 'node:fs';
import { extname, parse } from 'node:path';

import { BadRequestException, Body, Controller, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadType, User } from '@prisma/client';
import * as crypto from 'crypto';
import { diskStorage } from 'multer';
import { Auth } from 'src/core/auth/decorators/auth.decorator';
import { AuthType } from 'src/core/auth/enums/auth-type.enum';

import { CreateUploadRequestDto } from './dto/create-upload-request.dto';
import { EstimatesDto } from './dto/estimates.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadService } from './upload.service';

@Auth(AuthType.Bearer)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('cost')
  getEstimate(@Body() body: EstimatesDto) {
    return this.uploadService.getCostEstimate(body);
  }

  @Post('create')
  createUploadRequest(@Body() body: CreateUploadRequestDto, @Req() req: Request) {
    const { totalChunks, uploadType, fileName, size } = body
    const user = (req as any).user as User
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (totalChunks !== 1) {
      throw new BadRequestException('Total chunks must be 1');
    }

    if (uploadType === UploadType.MULTIPART_FILE) {
      throw new BadRequestException('Invalid upload type. Only single file upload is supported.');
    }

    // Validate filename has proper extension
    if (!fileName.includes('.')) {
      throw new BadRequestException('Filename must include a file extension');
    }

    const extension = fileName.split('.').pop();
    if (!extension || extension.length === 0) {
      throw new BadRequestException('Invalid file. No extension found');
    }

    if (size <= 0) {
      throw new BadRequestException('File size must be greater than 0');
    }

    if (size > 10000000) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    return this.uploadService.createUploadRequest(body, user);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('file', 1, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const walletAddress = (req as any).user.walletAddress;
        if (!walletAddress) {
          return cb(new BadRequestException('Invalid Auth Token Supplied with request'), '');
        }

        const uploadPath = `uploads/${walletAddress}`;
        // Ensure the staging directory exists.
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const randomStr = crypto.randomBytes(8).toString('hex');
        const ext = extname(file.originalname);
        // Extract original filename without extension
        const originalName = parse(file.originalname).name;
        cb(null, `${originalName}__@@${randomStr}@@__${ext}`);
      },
    }),
    limits: {
      fileSize: 10000000
    }
  }))
  async uploadFile(
    @Body() body: UploadFileDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request
  ) {
    const requestId = body.requestId;
    const uploadRequest = await this.uploadService.getUploadRequest(requestId);
    const paymentTransaction = await this.uploadService.getPaymentTransaction(uploadRequest.paymentTransactionId);
    const token = await this.uploadService.getToken(paymentTransaction.tokenId);

    const verified = await this.uploadService.verifyPayment({
      paymentTx: body.transactionId,
      chainType: token.chainType,
      network: token.network,
      chainId: +token.chainId,
      senderAddress: (req as any).user.walletAddress,
      amount: paymentTransaction.amountInSubUnits
    });

    if (!verified) {
      throw new BadRequestException('Payment verification failed. Invalid transaction hash or amount');
    }


    const receipt = await this.uploadService.createReceipt({
      uploadId: uploadRequest.id,
      paymentTransactionId: paymentTransaction.id,
      tokenId: token.id,
      userWalletAddress: (req as any).user.walletAddress,
      paymentTxnHash: body.transactionId,
      filePath: files[0].path,
      tags: body.tags
    })

    this.uploadService.queueFileToUpload({
      ...body,
      file: files[0]
    });

    return receipt
  }
}
