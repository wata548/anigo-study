import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, User } from "../App";

interface LoginViewProps {
  onClose: () => void;
  onLoginSuccess: (type: "student" | "user", data: Student | User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onClose, onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<"student" | "teacher" | "admin">(
    "student"
  );
  const [loginForm, setLoginForm] = useState({
    grade: 2,
    class: 1,
    number: 1,
    password: "",
    email: "",
    barcode: "",
  });
  const [isComposing, setIsComposing] = useState(false);

  const resetLoginForm = () => {
    setLoginForm({
      grade: 2,
      class: 1,
      number: 1,
      password: "",
      email: "",
      barcode: "",
    });
  };

  const handleLogin = async () => {
    try {
      if (loginType === "student") {
        const studentId = `${loginForm.grade}${loginForm.class}${String(
          loginForm.number
        ).padStart(2, "0")}`;
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("id", studentId)
          .eq("password", loginForm.password)
          .single();

        if (error || !data) {
          alert("학년, 반, 번호 또는 비밀번호가 일치하지 않습니다.");
          return;
        }

        onLoginSuccess("student", data);
        resetLoginForm();
        alert(`${data.name}님 환영합니다!`);
      } else {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", loginForm.email)
          .eq("password", loginForm.password)
          .eq("role", loginType === "admin" ? "admin" : "teacher")
          .single();

        if (error || !data) {
          alert("이메일 또는 비밀번호가 일치하지 않습니다.");
          return;
        }

        onLoginSuccess("user", data);
        resetLoginForm();
        alert(`${data.name}님 환영합니다!`);
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  const handleBarcodeLogin = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("barcode", loginForm.barcode)
        .single();

      if (error || !data) {
        alert("등록되지 않은 바코드입니다.");
        return;
      }

      onLoginSuccess("student", data);
      resetLoginForm();
      alert(`${data.name}님 환영합니다!`);
    } catch (error) {
      console.error("바코드 로그인 오류:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: isMobile ? "center" : "flex-start",
        justifyContent: isMobile ? "center" : "flex-end",
        zIndex: 1000,
        padding: "0",
        overflow: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
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

        {/* 로그인 유형 선택 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setLoginType("student")}
            style={{
              padding: "12px 8px",
              border:
                loginType === "student"
                  ? "2px solid #3B82F6"
                  : "1px solid #ddd",
              borderRadius: "8px",
              background: loginType === "student" ? "#EFF6FF" : "white",
              fontWeight: loginType === "student" ? "bold" : "normal",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            학생
          </button>
          <button
            onClick={() => setLoginType("teacher")}
            style={{
              padding: "12px 8px",
              border:
                loginType === "teacher"
                  ? "2px solid #3B82F6"
                  : "1px solid #ddd",
              borderRadius: "8px",
              background: loginType === "teacher" ? "#EFF6FF" : "white",
              fontWeight: loginType === "teacher" ? "bold" : "normal",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            교사
          </button>
          <button
            onClick={() => setLoginType("admin")}
            style={{
              padding: "12px 8px",
              border:
                loginType === "admin" ? "2px solid #3B82F6" : "1px solid #ddd",
              borderRadius: "8px",
              background: loginType === "admin" ? "#EFF6FF" : "white",
              fontWeight: loginType === "admin" ? "bold" : "normal",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            관리자
          </button>
        </div>

        {/* 학생 로그인 폼 */}
        {loginType === "student" && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                학년/반/번호로 로그인
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <select
                  value={loginForm.grade}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      grade: Number(e.target.value),
                    })
                  }
                  style={{
                    padding: "10px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                </select>
                <select
                  value={loginForm.class}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      class: Number(e.target.value),
                    })
                  }
                  style={{
                    padding: "10px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <option value={1}>1반</option>
                  <option value={2}>2반</option>
                  <option value={3}>3반</option>
                  <option value={4}>4반</option>
                </select>
                <input
                  type="number"
                  placeholder="번호"
                  value={loginForm.number}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      number: Number(e.target.value),
                    })
                  }
                  style={{
                    padding: "10px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호 (생년월일 4자리)"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isComposing) {
                    handleLogin();
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  fontSize: "14px",
                }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "8px",
                  lineHeight: "1.4",
                }}
              >
                테스트: 2학년 1반 1번 / 비밀번호: 0101
              </p>
            </div>

            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "14px",
                background: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              로그인
            </button>
          </>
        )}

        {/* 교사/관리자 로그인 폼 */}
        {(loginType === "teacher" || loginType === "admin") && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                이메일
              </label>
              <input
                type="email"
                placeholder={
                  loginType === "admin"
                    ? "admin@school.com"
                    : "teacher@school.com"
                }
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  fontSize: "14px",
                }}
              />{" "}
              <p
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "8px",
                  lineHeight: "1.4",
                }}
              >
                테스트:{" "}
                {loginType === "admin"
                  ? "admin@school.com"
                  : "teacher@school.com"}
              </p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isComposing) {
                    handleLogin();
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  fontSize: "14px",
                }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "8px",
                  lineHeight: "1.4",
                }}
              >
                테스트: {loginType === "admin" ? "admin1234" : "teacher1234"}
              </p>
            </div>
            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "14px",
                background: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              로그인
            </button>
          </>
        )}

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
      </div>
    </div>
  );
};

export default LoginView;
