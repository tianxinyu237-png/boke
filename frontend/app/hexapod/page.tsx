import type { Metadata } from "next";
import HexapodContent from "./hexapod-content";

export const metadata: Metadata = {
  title: "六足机器人本机调试台",
  description:
    "18 自由度六足机器人的浏览器仿真：手柄实时驱动、三角步态、18 个舵机角度读数，参数与真机一致。",
};

export default function HexapodPage() {
  return <HexapodContent />;
}
