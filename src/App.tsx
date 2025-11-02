import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import AdminView from "./components/AdminView";
import TeacherView from "./components/TeacherView";
import StudentView from "./components/StudentView";
import DashboardView from "./components/DashboardView";
import KioskView from "./components/KioskView";
import QueryView from "./components/QueryView";
import LoginView from "./components/LoginView";
import "./styles.css";

// 타입 정의
export interface Student {
  id: string;
  grade: number;
  class: number;
  number: number;
  name: string;
  barcode: string;
  password?: string;
  fixed_seat_id?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  password?: string;
}

export interface Seat {
  id: string;
  type: string;
  number: number;
  grade: number;
  group: string;
}

export interface Reservation {
  id: number;
  student_id: string;
  seat_id: string;
  date: string;
  status: string;
  check_in_time?: string;
}

export interface Absence {
  id: number;
  student_id: string;
  date: string;
  reason: string;
  note?: string;
}

// 좌석 생성
export const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  for (let i = 1; i <= 31; i++) {
    seats.push({
      id: `A-${i}`,
      type: "A그룹(3학년)",
      number: i,
      grade: 3,
      group: "A",
    });
  }
  for (let i = 1; i <= 39; i++) {
    seats.push({
      id: `B-${i}`,
      type: "B그룹(2폐쇄)",
      number: i,
      grade: 2,
      group: "B",
    });
  }
  for (let i = 1; i <= 26; i++) {
    seats.push({
      id: `C-${i}`,
      type: "C그룹(2폐쇄)",
      number: i,
      grade: 2,
      group: "C",
    });
  }
  for (let i = 1; i <= 32; i++) {
    seats.push({
      id: `D-${i}`,
      type: "D그룹(2오픈)",
      number: i,
      grade: 2,
      group: "D",
    });
  }
  return seats;
};

const App: React.FC = () => {
  const [view, setView] = useState("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [seats] = useState<Seat[]>(generateSeats());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [currentDate, setCurrentDate] = useState("");
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  // 하단 날짜 표시를 실시간으로 업데이트
  const [displayDate, setDisplayDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const updateDisplayDate = () => {
      const today = new Date().toISOString().split("T")[0];
      setDisplayDate(today);
    };

    updateDisplayDate();
    const interval = setInterval(updateDisplayDate, 60000); // 1분마다

    return () => clearInterval(interval);
  }, []);

  // 날짜 초기화
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);
  }, []);

  // 날짜가 설정된 후 데이터 로드
  useEffect(() => {
    if (currentDate) {
      loadData();
    }
  }, [currentDate]);
  // 날짜 초기화를 매번 체크하도록 수정
  useEffect(() => {
    const updateDate = () => {
      const today = new Date().toISOString().split("T")[0];
      if (currentDate !== today) {
        setCurrentDate(today);
      }
    };

    // 초기 설정
    updateDate();

    // 1분마다 날짜 체크 (자정 넘어가면 자동 업데이트)
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, [currentDate]);
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("grade", { ascending: true })
        .order("class", { ascending: true })
        .order("number", { ascending: true });

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      const { data: reservationsData, error: reservationsError } =
        await supabase.from("reservations").select("*").eq("date", currentDate);

      if (reservationsError) throw reservationsError;
      setReservations(reservationsData || []);

      const { data: absencesData, error: absencesError } = await supabase
        .from("absences")
        .select("*")
        .eq("date", currentDate);

      if (absencesError) throw absencesError;
      setAbsences(absencesData || []);

      setLoading(false);
    } catch (error) {
      console.error("데이터 로드 오류:", error);
      alert("데이터를 불러오는데 실패했습니다.");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedInStudent(null);
    setLoggedInUser(null);
    setView("dashboard");
    alert("로그아웃되었습니다.");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        데이터 로딩중...
      </div>
    );
  }

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      {showLogin && (
        <LoginView
          onClose={() => setShowLogin(false)}
          onLoginSuccess={(type, data) => {
            if (type === "student") {
              setLoggedInStudent(data as Student);
              setView("student");
            } else {
              setLoggedInUser(data as User);
              setView((data as User).role === "admin" ? "admin" : "teacher");
            }
            setShowLogin(false);
          }}
        />
      )}

      {/* 네비게이션 */}
      <nav
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "0 15px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "56px",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "10px" : "30px",
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: "bold",
                color: "#3B82F6",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              자율학습실
            </h1>
            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                flexWrap: isMobile ? "nowrap" : "wrap",
              }}
            >
              <button
                onClick={() => setView("dashboard")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: view === "dashboard" ? "#3B82F6" : "transparent",
                  color: view === "dashboard" ? "white" : "black",
                  cursor: "pointer",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                대시보드
              </button>
              {/* 키오스크 - 학생 로그인 아닐 때만 */}
              {!loggedInStudent && (
                <button
                  onClick={() => setView("kiosk")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: view === "kiosk" ? "#3B82F6" : "transparent",
                    color: view === "kiosk" ? "white" : "black",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  키오스크
                </button>
              )}

              {/* 학생 예약 - 학생 로그인 시 또는 관리자 */}
              {(loggedInStudent || loggedInUser?.role === "admin") && (
                <button
                  onClick={() => setView("student")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: view === "student" ? "#3B82F6" : "transparent",
                    color: view === "student" ? "white" : "black",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {loggedInStudent ? "예약" : "학생예약"}
                </button>
              )}
              {/* ✅ 교사 탭 - 교사 또는 관리자 */}
              {(loggedInUser?.role === "teacher" ||
                loggedInUser?.role === "admin") && (
                <button
                  onClick={() => setView("teacher")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: view === "teacher" ? "#3B82F6" : "transparent",
                    color: view === "teacher" ? "white" : "black",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  교사
                </button>
              )}
              {/* ✅ 관리자 탭 - 관리자만 */}
              {loggedInUser?.role === "admin" && (
                <button
                  onClick={() => setView("admin")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: view === "admin" ? "#3B82F6" : "transparent",
                    color: view === "admin" ? "white" : "black",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  관리자
                </button>
              )}
              {/* ✅ 조회 탭 - 교사, 관리자, 학생 */}
              {(loggedInUser || loggedInStudent) && (
                <button
                  onClick={() => setView("query")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: view === "query" ? "#3B82F6" : "transparent",
                    color: view === "query" ? "white" : "black",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  조회
                </button>
              )}
            </div>
          </div>

          <div>
            {loggedInStudent || loggedInUser ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {loggedInStudent ? loggedInStudent.name : loggedInUser?.name}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "6px 12px",
                    background: "#EF4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  padding: "8px 16px",
                  background: "#3B82F6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 컨텐츠 */}
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {view === "dashboard" && (
          <DashboardView
            students={students}
            seats={seats}
            reservations={reservations}
            absences={absences}
            currentDate={currentDate}
          />
        )}
        {view === "kiosk" && (
          <KioskView
            students={students}
            seats={seats}
            reservations={reservations}
            currentDate={currentDate}
            onDataChange={loadData}
          />
        )}
        {view === "student" && (
          <StudentView
            loggedInStudent={loggedInStudent}
            loggedInUser={loggedInUser} // ✅ 이미 추가했어야 함
            seats={seats}
            reservations={reservations}
            currentDate={currentDate}
            onDataChange={loadData}
            onShowLogin={() => setShowLogin(true)}
          />
        )}
        {view === "teacher" && (
          <TeacherView
            loggedInUser={loggedInUser}
            students={students}
            seats={seats}
            reservations={reservations}
            absences={absences}
            currentDate={currentDate}
            onDataChange={loadData}
          />
        )}
        {view === "admin" && (
          <AdminView
            loggedInUser={loggedInUser}
            students={students}
            currentDate={currentDate}
            onDataChange={loadData}
          />
        )}
        {view === "query" && (
          <QueryView
            students={students}
            reservations={reservations}
            absences={absences}
            currentDate={currentDate}
          />
        )}
      </div>

      {/* 날짜 표시 */}
      <div
        style={{
          position: "fixed",
          bottom: "15px",
          right: "15px",
          background: "white",
          padding: "8px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          fontSize: "13px",
        }}
      >
        <span style={{ fontWeight: "bold" }}>{currentDate}</span>
      </div>
    </div>
  );
};

export default App;
