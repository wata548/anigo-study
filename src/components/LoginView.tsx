import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { User, Student } from "../App";

interface LoginViewProps {
  onLoginSuccess: (user: User | null, student: Student | null) => void;
  onClose?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onClose }) => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // 🔍 학생 ID 형식 검증 및 파싱 (GCCNN)
  const parseStudentId = (
    id: string
  ): { grade: number; class: number; number: number } | null => {
    // 5자리 숫자인지 확인
    if (!/^\d{5}$/.test(id)) {
      return null;
    }

    const grade = parseInt(id[0]); // 첫 번째 자리: 학년
    const classNum = parseInt(id.substring(1, 3)); // 2-3번째 자리: 반
    const number = parseInt(id.substring(3, 5)); // 4-5번째 자리: 번호

    // 유효성 검증
    if (grade < 1 || grade > 3) return null;
    if (classNum < 1 || classNum > 4) return null;
    if (number < 1 || number > 99) return null;

    return { grade, class: classNum, number };
  };

  // 🎓 학생 로그인 처리
  const handleStudentLogin = async (parsedId: {
    grade: number;
    class: number;
    number: number;
  }) => {
    try {
      const { data: students, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("grade", parsedId.grade)
        .eq("class", parsedId.class)
        .eq("number", parsedId.number)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!students) {
        setError(
          `학생을 찾을 수 없습니다.\n(${parsedId.grade}학년 ${parsedId.class}반 ${parsedId.number}번)`
        );
        return;
      }

      // 🔥 DB에 저장된 실제 비밀번호와 비교
      if (password !== students.password) {
        setError("비밀번호가 일치하지 않습니다.");
        return;
      }

      // 로그인 성공 - localStorage에 저장
      localStorage.setItem("loggedInStudent", JSON.stringify(students));
      onLoginSuccess(null, students);
    } catch (err: any) {
      console.error("학생 로그인 오류:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    }
  };

  // 👨‍🏫 교사/관리자 로그인 처리
  const handleStaffLogin = async () => {
    try {
      const { data: users, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", loginId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!users) {
        setError("아이디를 찾을 수 없습니다.");
        return;
      }

      // 🔥 DB에 저장된 실제 비밀번호와 비교
      if (password !== users.password) {
        setError("비밀번호가 일치하지 않습니다.");
        return;
      }

      // 로그인 성공 - localStorage에 저장
      localStorage.setItem("loggedInUser", JSON.stringify(users));
      onLoginSuccess(users, null);
    } catch (err: any) {
      console.error("교사/관리자 로그인 오류:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    }
  };

  // 🔐 통합 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginId.trim()) {
      setError("아이디를 입력해주세요.");
      return;
    }

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // ID 형식으로 학생/교사 구분
      const parsedStudentId = parseStudentId(loginId);

      if (parsedStudentId) {
        // 5자리 숫자 → 학생 로그인
        await handleStudentLogin(parsedStudentId);
      } else {
        // 그 외 → 교사/관리자 로그인
        await handleStaffLogin();
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 모바일 체크
  const isMobile = window.innerWidth < 768;

  return (
    // 반투명 배경 오버레이
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: isMobile ? "center" : "flex-start",
        justifyContent: isMobile ? "center" : "flex-end",
        zIndex: 1000,
        padding: "0",
        overflow: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose && onClose();
        }
      }}
    >
      {/* 로그인 패널 */}
      <div
        style={{
          background: "white",
          borderRadius: isMobile ? "16px" : "0",
          padding: "25px 20px",
          maxWidth: isMobile ? "90%" : "400px",
          width: "100%",
          height: isMobile ? "auto" : "100vh",
          maxHeight: isMobile ? "90vh" : "100vh",
          overflow: "auto",
          margin: isMobile ? "15px" : "0",
          boxShadow: isMobile
            ? "0 4px 6px rgba(0,0,0,0.1)"
            : "-2px 0 8px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            marginBottom: "20px",
            textAlign: "center",
            fontSize: "22px",
          }}
        >
          로그인
        </h2>
        <form onSubmit={handleLogin}>
          {/* 아이디 입력 */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
                fontSize: "14px",
              }}
            >
              아이디
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="학생: 학번5자리 / 교사: teacher / 관리자: admin"
              style={{
                width: "90%",
                padding: "12px 16px",
                border: "2px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "border-color 0.2s",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginTop: "6px",
                lineHeight: "1.5",
              }}
            >
              💡 학생: 5자리 숫자 (학년+반+번호, 예: 20315)
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;교사/관리자: 아이디 입력
            </p>
          </div>

          {/* 비밀번호 입력 */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
                fontSize: "14px",
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              style={{
                width: "90%",
                padding: "12px 16px",
                border: "2px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "border-color 0.2s",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginTop: "6px",
              }}
            >
              💡 초기 비밀번호: 0000 (변경 권장)
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #EF4444",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  color: "#DC2626",
                  fontSize: "14px",
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#9CA3AF" : "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 취소 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "15px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginView;