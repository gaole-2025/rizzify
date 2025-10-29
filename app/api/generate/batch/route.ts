// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/src/lib/auth-helpers'
import { uploadInit, startGeneration } from '@/lib/api/client'
import { getR2Client } from '@/src/lib/r2'

export async function POST(request: NextRequest) {
  console.log('🚀 Starting batch generate API...')

  try {
    // 1. 认证用户
    const authResult = await authenticateUser(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = authResult.user

    // 2. 解析FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const gender = formData.get('gender') as string
    const style = formData.get('style') || 'classic'
    const plan = formData.get('plan') || 'free'

    console.log('📋 Batch data:', {
      gender,
      style,
      plan,
      fileName: file?.name,
      fileSize: file?.size
    })

    if (!file || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields: file and gender' },
        { status: 400 }
      )
    }

    // 3. 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Please upload a JPG or PNG image file' },
        { status: 400 }
      )
    }

    // 4. 获取上传初始化信息
    const uploadInitResponse = await uploadInit({
      filename: file.name,
      contentType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      sizeBytes: file.size,
    })

    console.log('📤 Upload init successful:', uploadInitResponse.fileId)

    // 5. 上传文件到R2
    console.log('📤 Uploading file to R2...')
    const uploadResponse = await fetch(uploadInitResponse.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      console.error('❌ Failed to upload file to R2:', uploadResponse.statusText)
      throw new Error('Failed to upload file to storage')
    }

    console.log('✅ File uploaded to R2 successfully')

    // 6. 创建生成任务
    console.log('🎨 Creating generation task...')
    const taskResponse = await startGeneration({
      gender: gender as 'male' | 'female',
      plan: plan as 'free' | 'start' | 'pro',
      fileId: uploadInitResponse.fileId,
      idempotencyKey: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })

    console.log('✅ Task created:', taskResponse.taskId)

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      taskId: taskResponse.taskId,
      fileId: uploadInitResponse.fileId,
      message: 'Batch processing started successfully'
    })

  } catch (error) {
    console.error('❌ Batch generate error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}