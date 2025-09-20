// app/api/tarot-gpt/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 와 같이 환경 변수로 관리하는 것을 권장합니다.
const genAI = new GoogleGenerativeAI("AIzaSyDfLKhX8uv9L4NoWwrXa66Zv6yhbAeEocU");

export async function POST(req: Request) {
  try {
    const { prompt, image } = await req.json();

    if (!prompt?.trim() || !image) {
      return NextResponse.json({ error: "프롬프트 또는 이미지가 유효하지 않습니다." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    const contents = [{
      role: "user",
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: image}},
      ],
    }];

    const result = await model.generateContent({ contents });
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ reading: text });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Gemini API 요청 실패", detail: err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
