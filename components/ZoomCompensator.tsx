"use client";

import { useEffect } from "react";

export default function ZoomCompensator() {
  useEffect(() => {
    const compensateZoom = () => {
      // 获取当前缩放级别
      const zoomLevel = window.devicePixelRatio || 1;
      const scale = 1 / zoomLevel;
      
      // 找到背景墙容器并应用反向缩放
      const imageWall = document.querySelector('[data-image-wall="true"]');
      if (imageWall) {
        (imageWall as HTMLElement).style.transform = `scale(${scale})`;
        (imageWall as HTMLElement).style.transformOrigin = "top left";
        (imageWall as HTMLElement).style.width = `${100 / scale}%`;
        (imageWall as HTMLElement).style.height = `${100 / scale}%`;
      }
    };

    // 监听缩放事件
    window.addEventListener("resize", compensateZoom);
    window.addEventListener("orientationchange", compensateZoom);
    
    // 初始化
    compensateZoom();

    return () => {
      window.removeEventListener("resize", compensateZoom);
      window.removeEventListener("orientationchange", compensateZoom);
    };
  }, []);

  return null;
}
