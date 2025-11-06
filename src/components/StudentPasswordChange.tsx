import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student } from "../App";

interface StudentPasswordChangeProps {
  loggedInStudent: Student | null;
}

const StudentPasswordChange: React.FC<StudentPasswordChangeProps> = ({
  loggedInStudent,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!loggedInStudent) {
    return (
      <div style={{ padding: "20px" }}>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "모든 항목을 입력해주세요." });
      return;
    }

    if (currentPassword !== loggedInStudent.password) {
      setMessage({ type: "error", text: "현재 비밀번호가 일치하지 않습니다." });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({
        type: "error",
        text: "새 비밀번호는 최소 4자 이상이어야 합니다.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "새 비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setMessage({
        type: "error",
        text: "현재 비밀번호와 다른 비밀번호를 입력해주세요.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .update({ password: newPassword })
        .eq("id", loggedInStudent.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "✓ 비밀번호가 성공적으로 변경되었습니다!",
      });

      // 입력 필드 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // 3초 후 메시지 제거
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("비밀번호 변경 오류:", error);
      setMessage({
        type: "error",
        text: "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
      });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>
        🔐 비밀번호 변경
      </h2>

      <div
        style={{
          background: "#EFF6FF",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #BFDBFE",
        }}
      >
        <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#1E40AF" }}>
          <strong>📌 안내사항</strong>
          <br />• 비밀번호는 최소 4자 이상이어야 합니다
          <br />• 이전 비밀번호와 다른 비밀번호를 사용해주세요
          <br />• 비밀번호를 잊어버린 경우 관리자에게 문의하세요
        </p>
      </div>

      <form
        onSubmit={handlePasswordChange}
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#374151",
            }}
          >
            현재 비밀번호
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호를 입력하세요"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#374151",
            }}
          >
            새 비밀번호
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호를 입력하세요 (최소 4자)"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#374151",
            }}
          >
            새 비밀번호 확인
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호를 다시 입력하세요"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              background: message.type === "success" ? "#D1FAE5" : "#FEE2E2",
              border: `1px solid ${
                message.type === "success" ? "#10B981" : "#EF4444"
              }`,
              color: message.type === "success" ? "#065F46" : "#991B1B",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            background: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#2563EB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#3B82F6")}
        >
          비밀번호 변경
        </button>
      </form>
    </div>
  );
};

export default StudentPasswordChange;
