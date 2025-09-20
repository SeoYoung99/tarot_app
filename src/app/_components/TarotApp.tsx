'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { heicTo, isHeic } from "heic-to"

// Shadcn/ui 컴포넌트를 이 파일 내에 직접 정의합니다.
const Card = ({ className, children, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
  <div
    className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardContent = ({ className, children, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(({ className, ...props }, ref) => (
  <input
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

const Button = ({ className, children, ...props }: React.ComponentPropsWithoutRef<'button'>) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);
type Reading = string;

export default function TarotApp() {
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState(1);
  const [cardImage, setCardImage] = useState<string>();
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuestionSubmit = () => {
    if (!question.trim()) return;
    setStep(2);
  };

  const handleCardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();
    setIsLoading(true);
    setReading(null);

    const input = e.currentTarget.elements.namedItem("cards") as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) {
      alert("카드를 업로드해주세요.");
      setIsLoading(false);
      return;
    }

    if (input.files.length !== 1) {
      alert("정확히 1장의 카드를 업로드해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const file = input.files[0];
      let processedFile: Blob = file;

      // HEIC 파일인 경우 변환
      if (await isHeic(file)) {
        processedFile = await heicTo({ blob: file, type: "image/jpeg", quality: 0.8 });
      }

      // 처리된 파일을 Base64 문자열로 변환
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(processedFile);
      });

      const imageData = base64Image.split(',')[1];
      setCardImage(base64Image); // 이미지 미리보기
      setStep(3);

      const prompt = `
        사용자가 타로 카드를 한 장 뽑았습니다.
        사용자가 질문한 내용:
        “${question}”

        카드의 의미를 이 질문 맥락에 맞춰 자세히 해석해줘.
        최대한 긍정적이고 희망적인 메시지로 답변해줘.`;

      const response = await fetch("/api/tarot-gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, image: imageData }),
      });

      if (!response.ok) {
        throw new Error("API 요청 실패");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setReading(result.reading);

    } catch (err) {
      let errorMessage = "알 수 없는 오류가 발생했습니다.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      alert(`카드 해석 중 오류가 발생했습니다: ${errorMessage}`);
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 font-sans bg-gradient-to-b from-purple-100 to-white min-h-screen">
      <h1 className="text-5xl font-bold text-center text-purple-800 drop-shadow-lg tracking-tight">🔮 타로 셀프 리딩</h1>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <Card className="bg-white shadow-xl border border-purple-300 w-full max-w-lg">
            <CardContent className="p-8 space-y-6">
              <p className="text-xl text-purple-800 font-medium text-center">당신의 마음속 질문은 무엇인가요?</p>
              <Input
                placeholder="예: 앞으로의 커리어 방향은 어떻게 될까?"
                value={question}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                className="border-purple-300 text-lg px-4 py-3"
              />
              <div className="flex justify-center">
                <Button onClick={handleQuestionSubmit} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 text-lg rounded-full">
                  질문 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <p className="text-2xl text-purple-800 font-semibold">손으로 직접 1장을 뽑아보세요 🃏</p>
          <form onSubmit={handleCardSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">뽑은 카드 1장의 이미지를 업로드해주세요.</p>
            <input
              type="file"
              name="cards"
              accept="image/*"
              required
              className="file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-base file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
            />
            <div>
              <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 text-lg rounded-full">
                {isLoading ? "해석 중..." : "카드 해석"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === 3 && isLoading && (
        <div className="text-center">
          <p className="text-xl text-purple-800 font-medium">카드를 해석 중입니다...</p>
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mt-4"></div>
        </div>
      )}

      {step === 3 && !isLoading && reading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h2 className="text-3xl font-semibold text-purple-800 text-center">🧾 리딩 결과</h2>
          <div className="flex justify-center">
            <Card className="bg-white shadow-lg border border-purple-200 w-full max-w-sm">
              <CardContent className="p-4 flex flex-col items-center">
                <img src={cardImage} alt="타로 카드" className="w-full h-auto rounded-lg shadow-md mb-4" />
                <p className="text-base mt-2 text-gray-700 text-center">{reading}</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center mt-8">
            <Button onClick={() => setStep(1)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 text-lg rounded-full">
              다시 시작
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
