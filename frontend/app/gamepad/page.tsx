import type { Metadata } from "next";
import GamepadContent from "./gamepad-content";

export const metadata: Metadata = {
  title: "手柄遥控台",
  description:
    "浏览器直读 XInput 手柄：四轴 + 两扳机 + 12 键实时可视化，附六足机器人摇杆映射方案。",
};

export default function GamepadPage() {
  return <GamepadContent />;
}
