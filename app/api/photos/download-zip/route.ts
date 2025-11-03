// @ts-nocheck
/**
 * 批量下载照片为 ZIP 文件
 * 支持按 section 下载所有照片
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db/client'
import { authenticateUser } from '@/src/lib/auth-helpers'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { section } = body

    if (!section) {
      return NextResponse.json(
        { error: 'Missing section' },
        { status: 400 }
      )
    }

    // 认证用户
    const authResult = await authenticateUser(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      )
    }

    const userId = authResult.user.id
    console.log(`📦 Download ZIP API: 用户 ${userId} 请求下载所有 ${section} 照片`)

    // 查询该 section 的所有照片
    const photos = await db.photo.findMany({
      where: {
        section: section,
        task: {
          userId: userId
        }
      },
      select: {
        id: true,
        objectKey: true,
        originalName: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'No photos found in this section' },
        { status: 404 }
      )
    }

    console.log(`✅ Download ZIP API: 找到 ${photos.length} 张照片，开始打包`)

    // 创建 ZIP
    const zip = new JSZip()
    let downloadedCount = 0

    // 下载每张照片并添加到 ZIP
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      try {
        const photoUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_USER_DATA_DOMAIN || process.env.CLOUDFLARE_R2_USER_DATA_DOMAIN || 'https://cdn.rizzify.org'}/${photo.objectKey}` // 从 R2 存储下载
        const response = await fetch(photoUrl)
        
        if (!response.ok) {
          console.warn(`⚠️ 下载失败: ${photoUrl}`)
          continue
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const filename = `${section}_${i + 1}.jpg`
        zip.file(filename, buffer)
        downloadedCount++
      } catch (err) {
        console.error(`❌ 下载照片失败: ${photo.objectKey}`, err)
      }
    }

    if (downloadedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to download any photos' },
        { status: 500 }
      )
    }

    console.log(`✅ Download ZIP API: 成功打包 ${downloadedCount}/${photos.length} 张照片`)

    // 生成 ZIP 文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // 返回 ZIP 文件
    const filename = `rizzify_${section}_all_${Date.now()}.zip`
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('❌ Download ZIP API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create ZIP file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
