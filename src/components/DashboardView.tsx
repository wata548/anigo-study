import React from "react";
import { Student, Seat, Reservation, Absence } from "../App";

interface DashboardViewProps {
  students: Student[];
  seats: Seat[];
  reservations: Reservation[];
  absences: Absence[];
  currentDate: string;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  seats,
  reservations,
  absences,
  currentDate,
}) => {
  const isMobile = window.innerWidth < 768;

  // 학년별 학생 수
  const grade1Students = students.filter((s) => s.grade === 1);
  const grade2Students = students.filter((s) => s.grade === 2);
  const grade3Students = students.filter((s) => s.grade === 3);

  // 오늘 예약 데이터
  const todayReservations = reservations.filter((r) => r.date === currentDate);
  const todayAbsences = absences.filter((a) => a.date === currentDate);

  // 학년별 학생 ID 추출 함수
  const getGradeStudentIds = (grade: number) => {
    return students.filter((s) => s.grade === grade).map((s) => s.id);
  };

  const grade1StudentIds = getGradeStudentIds(1);
  const grade2StudentIds = getGradeStudentIds(2);
  const grade3StudentIds = getGradeStudentIds(3);

  // 학년별 통계 계산
  const grade1Reserved = todayReservations.filter(
    (r) => grade1StudentIds.includes(r.student_id) && r.status === "예약"
  ).length;
  const grade2Reserved = todayReservations.filter(
    (r) => grade2StudentIds.includes(r.student_id) && r.status === "예약"
  ).length;
  const grade3Reserved = todayReservations.filter(
    (r) => grade3StudentIds.includes(r.student_id) && r.status === "예약"
  ).length;

  const grade1CheckedIn = todayReservations.filter(
    (r) => grade1StudentIds.includes(r.student_id) && r.status === "입실완료"
  ).length;
  const grade2CheckedIn = todayReservations.filter(
    (r) => grade2StudentIds.includes(r.student_id) && r.status === "입실완료"
  ).length;
  const grade3CheckedIn = todayReservations.filter(
    (r) => grade3StudentIds.includes(r.student_id) && r.status === "입실완료"
  ).length;

  const grade1NoShow = todayReservations.filter(
    (r) => grade1StudentIds.includes(r.student_id) && r.status === "미입실"
  ).length;
  const grade2NoShow = todayReservations.filter(
    (r) => grade2StudentIds.includes(r.student_id) && r.status === "미입실"
  ).length;
  const grade3NoShow = todayReservations.filter(
    (r) => grade3StudentIds.includes(r.student_id) && r.status === "미입실"
  ).length;

  const grade1Absent = todayAbsences.filter((a) =>
    grade1StudentIds.includes(a.student_id)
  ).length;
  const grade2Absent = todayAbsences.filter((a) =>
    grade2StudentIds.includes(a.student_id)
  ).length;
  const grade3Absent = todayAbsences.filter((a) =>
    grade3StudentIds.includes(a.student_id)
  ).length;

  // 전체 통계
  const stats = {
    total: students.length,
    reserved: todayReservations.filter((r) => r.status === "예약").length,
    checkedIn: todayReservations.filter((r) => r.status === "입실완료").length,
    noShow: todayReservations.filter((r) => r.status === "미입실").length,
    absent: todayAbsences.length,
  };

  return (
    <div style={{ padding: "15px" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "20px" }}>
        자율학습실 실시간 현황
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
          gap: "12px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            background: "#DBEAFE",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#666" }}>전체 학생</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {stats.total}명
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                marginTop: "8px",
                lineHeight: "1.8",
              }}
            >
              <div>
                1학년: {grade1Students.length}명 / 2학년:{" "}
                {grade2Students.length}명 / 3학년: {grade3Students.length}명
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#FEF3C7",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#666" }}>예약</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {stats.reserved}명
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                marginTop: "8px",
                lineHeight: "1.8",
              }}
            >
              <div>
                1학년: {grade1Reserved}명 / 2학년: {grade2Reserved}명 / 3학년:{" "}
                {grade3Reserved}명
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#D1FAE5",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#666" }}>입실</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {stats.checkedIn}명
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                marginTop: "8px",
                lineHeight: "1.8",
              }}
            >
              <div>
                1학년: {grade1CheckedIn}명 / 2학년: {grade2CheckedIn}명 / 3학년:{" "}
                {grade3CheckedIn}명
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#FEE2E2",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#666" }}>미입실</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {stats.noShow}명
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                marginTop: "8px",
                lineHeight: "1.8",
              }}
            >
              <div>
                1학년: {grade1NoShow}명 / 2학년: {grade2NoShow}명 / 3학년:{" "}
                {grade3NoShow}명
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#F3F4F6",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#666" }}>사유제출</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {stats.absent}명
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                marginTop: "8px",
                lineHeight: "1.8",
              }}
            >
              <div>
                1학년: {grade1Absent}명 / 2학년: {grade2Absent}명 / 3학년:{" "}
                {grade3Absent}명
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
        }}
      >
        <h3
          style={{
            textAlign: "center",
            marginBottom: "12px",
            fontSize: "16px",
          }}
        >
          좌석 배치도
        </h3>
        <img
          src="https://raw.githubusercontent.com/skywind99/temp/refs/heads/main/anigo5f.PNG"
          alt="좌석 배치도"
          style={{
            width: "100%",
            maxWidth: "800px",
            margin: "0 auto",
            display: "block",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "15px",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
            A그룹 - 3학년 (31석)
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(6, 1fr)"
                : "repeat(7, 1fr)",
              gap: "6px",
            }}
          >
            {seats
              .filter((s) => s.group === "A")
              .map((seat) => {
                const reservation = reservations.find(
                  (r) => r.seat_id === seat.id && r.date === currentDate
                );
                return (
                  <div
                    key={seat.id}
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      borderRadius: "4px",
                      fontSize: "13px",
                      background:
                        reservation?.status === "입실완료"
                          ? "#D1FAE5"
                          : reservation?.status === "예약"
                          ? "#FEF3C7"
                          : reservation?.status === "미입실"
                          ? "#FEE2E2"
                          : "#F3F4F6",
                    }}
                  >
                    {seat.number}
                  </div>
                );
              })}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
            B그룹 - 2학년 폐쇄형 (39석)
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(6, 1fr)"
                : "repeat(7, 1fr)",
              gap: "6px",
            }}
          >
            {seats
              .filter((s) => s.group === "B")
              .map((seat) => {
                const reservation = reservations.find(
                  (r) => r.seat_id === seat.id && r.date === currentDate
                );
                return (
                  <div
                    key={seat.id}
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      borderRadius: "4px",
                      fontSize: "13px",
                      background:
                        reservation?.status === "입실완료"
                          ? "#D1FAE5"
                          : reservation?.status === "예약"
                          ? "#FEF3C7"
                          : reservation?.status === "미입실"
                          ? "#FEE2E2"
                          : "#F3F4F6",
                    }}
                  >
                    {seat.number}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "15px",
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
            C그룹 - 2학년 폐쇄형 (26석)
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(6, 1fr)"
                : "repeat(7, 1fr)",
              gap: "6px",
            }}
          >
            {seats
              .filter((s) => s.group === "C")
              .map((seat) => {
                const reservation = reservations.find(
                  (r) => r.seat_id === seat.id && r.date === currentDate
                );
                return (
                  <div
                    key={seat.id}
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      borderRadius: "4px",
                      fontSize: "13px",
                      background:
                        reservation?.status === "입실완료"
                          ? "#D1FAE5"
                          : reservation?.status === "예약"
                          ? "#FEF3C7"
                          : reservation?.status === "미입실"
                          ? "#FEE2E2"
                          : "#F3F4F6",
                    }}
                  >
                    {seat.number}
                  </div>
                );
              })}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>
            D그룹 - 2학년 오픈형 (32석)
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(6, 1fr)"
                : "repeat(8, 1fr)",
              gap: "6px",
            }}
          >
            {seats
              .filter((s) => s.group === "D")
              .map((seat) => {
                const reservation = reservations.find(
                  (r) => r.seat_id === seat.id && r.date === currentDate
                );
                return (
                  <div
                    key={seat.id}
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      borderRadius: "4px",
                      fontSize: "13px",
                      background:
                        reservation?.status === "입실완료"
                          ? "#D1FAE5"
                          : reservation?.status === "예약"
                          ? "#FEF3C7"
                          : reservation?.status === "미입실"
                          ? "#FEE2E2"
                          : "#F3F4F6",
                    }}
                  >
                    {seat.number}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          fontSize: "13px",
          flexWrap: "wrap",
        }}
      >
        {[
          { bg: "#F3F4F6", label: "빈자리" },
          { bg: "#FEF3C7", label: "예약" },
          { bg: "#D1FAE5", label: "입실" },
          { bg: "#FEE2E2", label: "미입실" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                background: item.bg,
                borderRadius: "2px",
                border: "1px solid #ddd",
              }}
            ></div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
