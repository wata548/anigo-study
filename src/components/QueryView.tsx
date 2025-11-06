import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, Reservation, Absence, User } from "../App";

interface QueryViewProps {
  students: Student[];
  reservations: Reservation[];
  absences: Absence[];
  currentDate: string;
  loggedInUser: User | null;
  onDataChange: () => void;
}

const QueryView: React.FC<QueryViewProps> = ({
  students,
  reservations,
  absences,
  currentDate,
  loggedInUser,
  onDataChange,
}) => {
  const [queryDate, setQueryDate] = useState(currentDate);
  const [queryGrade, setQueryGrade] = useState(2);
  const [processingNoShow, setProcessingNoShow] = useState(false);

  const gradeStudents = students.filter((s) => s.grade === queryGrade);
  const dateReservations = reservations.filter((r) => r.date === queryDate);
  const dateAbsences = absences.filter((a) => a.date === queryDate);

  const dateData = gradeStudents.map((s) => {
    const res = dateReservations.find((r) => r.student_id === s.id);
    const abs = dateAbsences.find((a) => a.student_id === s.id);
    return { ...s, reservation: res, absence: abs };
  });

  const dateStats = {
    total: gradeStudents.length,
    checkedIn: dateData.filter((s) => s.reservation?.status === "입실완료")
      .length,
    reserved: dateData.filter(
      (s) => s.reservation?.status === "예약" && s.grade !== 1
    ).length,
    noShow: dateData.filter(
      (s) =>
        s.reservation?.status === "미입실" || (s.grade === 1 && !s.reservation)
    ).length,
    absent: dateData.filter((s) => s.absence).length,
  };

  const downloadReport = () => {
    const csv = [
      ["학년", "반", "번호", "이름", "상태", "좌석", "사유"].join(","),
      ...dateData.map((s) =>
        [
          s.grade,
          s.class,
          s.number,
          s.name,
          s.reservation?.status === "입실완료"
            ? "출석"
            : s.reservation?.status === "예약"
            ? "예약"
            : s.reservation?.status === "미입실"
            ? "미입실"
            : s.absence
            ? "사유제출"
            : "미신청",
          s.reservation?.seat_id || "-",
          s.absence?.reason || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `출결조회_${queryDate}_${queryGrade}학년.csv`;
    link.click();
    alert("출결 보고서가 다운로드되었습니다.");
  };

  const handleNoShowCheck = async () => {
    if (
      !loggedInUser ||
      (loggedInUser.role !== "teacher" && loggedInUser.role !== "admin")
    ) {
      alert("교사 또는 관리자 권한이 필요합니다.");
      return;
    }

    if (
      !window.confirm(
        `${queryDate}의 예약 상태를 미입실로 일괄 변경하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      setProcessingNoShow(true);

      const reservationsToUpdate = dateReservations
        .filter((r) => r.status === "예약")
        .map((r) => r.id);

      if (reservationsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("reservations")
          .update({ status: "미입실" })
          .in("id", reservationsToUpdate);

        if (updateError) throw updateError;
      }

      const studentsToAdd = gradeStudents.filter((s) => {
        const hasReservation = dateReservations.find(
          (r) => r.student_id === s.id
        );
        const hasAbsence = dateAbsences.find((a) => a.student_id === s.id);
        return !hasReservation && !hasAbsence;
      });

      if (studentsToAdd.length > 0) {
        const newReservations = studentsToAdd.map((s) => ({
          student_id: s.id,
          seat_id: s.grade === 1 ? s.fixed_seat_id : null,
          date: queryDate,
          status: "미입실",
          check_in_time: null,
        }));

        const { error: insertError } = await supabase
          .from("reservations")
          .insert(newReservations);

        if (insertError) throw insertError;
      }

      alert(
        `✅ 미입실 체크가 완료되었습니다.\n변경: ${reservationsToUpdate.length}건\n추가: ${studentsToAdd.length}건`
      );
      await onDataChange();
    } catch (error) {
      console.error("미입실 체크 오류:", error);
      alert("미입실 체크에 실패했습니다.");
    } finally {
      setProcessingNoShow(false);
    }
  };

  const isMobile = window.innerWidth < 768;
  const isTeacherOrAdmin =
    loggedInUser &&
    (loggedInUser.role === "teacher" || loggedInUser.role === "admin");

  return (
    <div style={{ padding: "15px", maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
          출결 조회
        </h1>

        {isTeacherOrAdmin && (
          <button
            onClick={handleNoShowCheck}
            disabled={processingNoShow}
            style={{
              padding: "10px 20px",
              background: processingNoShow ? "#9CA3AF" : "#EF4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: processingNoShow ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            {processingNoShow ? "처리중..." : "⚠️ 미입실 체크"}
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "stretch",
        }}
      >
        <input
          type="date"
          value={queryDate}
          onChange={(e) => setQueryDate(e.target.value)}
          style={{
            padding: "12px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            flex: isMobile ? "1" : "auto",
          }}
        />
        <select
          value={queryGrade}
          onChange={(e) => setQueryGrade(Number(e.target.value))}
          style={{
            padding: "12px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            flex: isMobile ? "1" : "auto",
          }}
        >
          <option value={1}>1학년</option>
          <option value={2}>2학년</option>
          <option value={3}>3학년</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        {[1, 2, 3, 4].map((classNum) => {
          const classData = dateData.filter((s) => s.class === classNum);
          return (
            <div
              key={classNum}
              style={{
                border: "2px solid #ddd",
                borderRadius: "12px",
                padding: "15px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                }}
              >
                {queryGrade}학년 {classNum}반
              </h3>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {classData.map((s) => {
                  let displayText = "미신청";
                  let bgColor = "#F3F4F6";

                  if (s.reservation?.status === "입실완료") {
                    displayText = s.reservation.seat_id || "출석";
                    bgColor = "#D1FAE5";
                  } else if (s.reservation?.status === "예약") {
                    displayText = "예약";
                    bgColor = "#FEF3C7";
                  } else if (s.reservation?.status === "미입실") {
                    displayText = "미입실";
                    bgColor = "#FEE2E2";
                  } else if (s.absence) {
                    displayText = s.absence.reason;
                    bgColor = "#DBEAFE";
                  } else if (s.grade === 1) {
                    displayText = "미입실";
                    bgColor = "#FEE2E2";
                  }

                  return (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #E5E7EB",
                        fontSize: "14px",
                      }}
                    >
                      <span>
                        {s.number}. {s.name}
                        {s.fixed_seat_id && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#10B981",
                              marginLeft: "5px",
                            }}
                          >
                            📌{s.fixed_seat_id}
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          background: bgColor,
                        }}
                      >
                        {displayText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: "#F3F4F6",
          padding: "15px",
          borderRadius: "12px",
          marginBottom: "15px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}
        >
          통계 ({queryDate})
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
            gap: "15px",
            fontSize: "14px",
          }}
        >
          <div>
            <span style={{ color: "#666" }}>전체: </span>
            <span style={{ fontWeight: "bold", fontSize: "18px" }}>
              {dateStats.total}명
            </span>
          </div>
          <div>
            <span style={{ color: "#666" }}>출석: </span>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                color: "#10B981",
              }}
            >
              {dateStats.checkedIn}명
            </span>
          </div>
          <div>
            <span style={{ color: "#666" }}>예약: </span>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                color: "#F59E0B",
              }}
            >
              {dateStats.reserved}명
            </span>
          </div>
          <div>
            <span style={{ color: "#666" }}>미입실: </span>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                color: "#EF4444",
              }}
            >
              {dateStats.noShow}명
            </span>
          </div>
          <div>
            <span style={{ color: "#666" }}>사유: </span>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                color: "#3B82F6",
              }}
            >
              {dateStats.absent}명
            </span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={downloadReport}
          style={{
            padding: "14px 40px",
            background: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          📥 CSV 다운로드
        </button>
      </div>
    </div>
  );
};

export default QueryView;
