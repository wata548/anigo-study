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
  const [queryMode, setQueryMode] = useState<"daily" | "monthly">("daily"); // ✅ 일별/월별 모드
  const [queryDate, setQueryDate] = useState(currentDate);
  const [queryMonth, setQueryMonth] = useState(currentDate.substring(0, 7)); // YYYY-MM
  const [queryGrade, setQueryGrade] = useState(2);
  const [processingNoShow, setProcessingNoShow] = useState(false);
  const [showWithdrawn, setShowWithdrawn] = useState(false);

  // 퇴사자 필터 적용
  const filteredStudents = showWithdrawn
    ? students
    : students.filter((s) => !s.is_withdrawn);

  const gradeStudents = filteredStudents.filter((s) => s.grade === queryGrade);

  // ✅ 일별 데이터
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

  // ✅ 월별 데이터
  const monthReservations = reservations.filter((r) =>
    r.date.startsWith(queryMonth)
  );
  const monthAbsences = absences.filter((a) => a.date.startsWith(queryMonth));

  const monthData = gradeStudents.map((s) => {
    const studentReservations = monthReservations.filter(
      (r) => r.student_id === s.id
    );
    const studentAbsences = monthAbsences.filter((a) => a.student_id === s.id);

    const checkedInCount = studentReservations.filter(
      (r) => r.status === "입실완료"
    ).length;
    const noShowCount = studentReservations.filter(
      (r) => r.status === "미입실"
    ).length;
    const absenceCount = studentAbsences.length;

    return {
      ...s,
      checkedInCount,
      noShowCount,
      absenceCount,
      totalDays: checkedInCount + noShowCount + absenceCount,
    };
  });

  const monthStats = {
    total: gradeStudents.length,
    avgCheckedIn:
      monthData.reduce((sum, s) => sum + s.checkedInCount, 0) /
        gradeStudents.length || 0,
    avgNoShow:
      monthData.reduce((sum, s) => sum + s.noShowCount, 0) /
        gradeStudents.length || 0,
    avgAbsent:
      monthData.reduce((sum, s) => sum + s.absenceCount, 0) /
        gradeStudents.length || 0,
  };

  const downloadReport = () => {
    if (queryMode === "daily") {
      // 일별 CSV
      const csv = [
        ["학년", "반", "번호", "이름", "상태", "좌석", "사유", "퇴사여부"].join(
          ","
        ),
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
            s.is_withdrawn ? "퇴사" : "",
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
    } else {
      // 월별 CSV
      const csv = [
        [
          "학년",
          "반",
          "번호",
          "이름",
          "출석일수",
          "미입실",
          "사유제출",
          "합계",
          "출석율",
        ].join(","),
        ...monthData.map((s) =>
          [
            s.grade,
            s.class,
            s.number,
            s.name,
            s.checkedInCount,
            s.noShowCount,
            s.absenceCount,
            s.totalDays,
            s.totalDays > 0
              ? `${((s.checkedInCount / s.totalDays) * 100).toFixed(1)}%`
              : "0%",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `월별출결_${queryMonth}_${queryGrade}학년.csv`;
      link.click();
    }
    alert("보고서가 다운로드되었습니다.");
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

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* 퇴사자 필터 */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              background: showWithdrawn ? "#FEE2E2" : "white",
              fontSize: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={showWithdrawn}
              onChange={(e) => setShowWithdrawn(e.target.checked)}
            />
            <span>퇴사자 표시</span>
          </label>

          {/* 미입실 체크 (일별 모드에서만) */}
          {queryMode === "daily" && isTeacherOrAdmin && (
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
      </div>

      {/* ✅ 일별/월별 모드 선택 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "20px",
          maxWidth: "300px",
        }}
      >
        <button
          onClick={() => setQueryMode("daily")}
          style={{
            padding: "12px",
            border:
              queryMode === "daily" ? "2px solid #3B82F6" : "1px solid #ddd",
            borderRadius: "8px",
            background: queryMode === "daily" ? "#EFF6FF" : "white",
            fontWeight: queryMode === "daily" ? "bold" : "normal",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          📅 일별 조회
        </button>
        <button
          onClick={() => setQueryMode("monthly")}
          style={{
            padding: "12px",
            border:
              queryMode === "monthly" ? "2px solid #3B82F6" : "1px solid #ddd",
            borderRadius: "8px",
            background: queryMode === "monthly" ? "#EFF6FF" : "white",
            fontWeight: queryMode === "monthly" ? "bold" : "normal",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          📊 월별 조회
        </button>
      </div>

      {/* 날짜/월 선택 */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "stretch",
        }}
      >
        {queryMode === "daily" ? (
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
        ) : (
          <input
            type="month"
            value={queryMonth}
            onChange={(e) => setQueryMonth(e.target.value)}
            style={{
              padding: "12px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "14px",
              flex: isMobile ? "1" : "auto",
            }}
          />
        )}
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

      {/* ✅ 일별 조회 화면 */}
      {queryMode === "daily" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)"
                : "repeat(4, 1fr)",
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

                      if (s.is_withdrawn) {
                        displayText = "퇴사";
                        bgColor = "#FEE2E2";
                      } else if (s.reservation?.status === "입실완료") {
                        displayText = s.reservation.seat_id || "출석";
                        bgColor = "#D1FAE5";
                      } else if (s.reservation?.status === "예약") {
                        displayText = s.reservation.seat_id;//"예약";
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
                            opacity: s.is_withdrawn ? 0.6 : 1,
                          }}
                        >
                          <span>
                            {s.number}. {s.name}
                            {s.is_withdrawn && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "#EF4444",
                                  marginLeft: "5px",
                                  background: "#FEE2E2",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  fontWeight: "bold",
                                }}
                              >
                                퇴사
                              </span>
                            )}
                            {s.fixed_seat_id && !s.is_withdrawn && (
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
                gridTemplateColumns: isMobile
                  ? "repeat(2, 1fr)"
                  : "repeat(5, 1fr)",
                gap: "15px",
                fontSize: "14px",
              }}
            >
              <div>
                <span style={{ color: "#666" }}>전체: </span>
                <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                  {dateStats.total}명
                </span>
                {!showWithdrawn &&
                  students.filter(
                    (s) => s.grade === queryGrade && s.is_withdrawn
                  ).length > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#EF4444",
                        marginLeft: "5px",
                      }}
                    >
                      (퇴사{" "}
                      {
                        students.filter(
                          (s) => s.grade === queryGrade && s.is_withdrawn
                        ).length
                      }
                      명 제외)
                    </span>
                  )}
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
        </>
      )}

      {/* ✅ 월별 조회 화면 */}
      {queryMode === "monthly" && (
        <>
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              overflow: "auto",
              border: "2px solid #ddd",
              marginBottom: "20px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "700px",
              }}
            >
              <thead>
                <tr style={{ background: "#F3F4F6" }}>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    반
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    번호
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    이름
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    출석
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    미입실
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    사유
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    합계
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "2px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    출석율
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthData
                  .sort((a, b) => {
                    if (a.class !== b.class) return a.class - b.class;
                    return a.number - b.number;
                  })
                  .map((s, idx) => (
                    <tr
                      key={s.id}
                      style={{
                        background: s.is_withdrawn
                          ? "#FEE2E2"
                          : idx % 2 === 0
                          ? "white"
                          : "#F9FAFB",
                        opacity: s.is_withdrawn ? 0.6 : 1,
                      }}
                    >
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #E5E7EB",
                        }}
                      >
                        {s.class}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #E5E7EB",
                        }}
                      >
                        {s.number}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #E5E7EB",
                        }}
                      >
                        {s.name}
                        {s.is_withdrawn && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#EF4444",
                              marginLeft: "5px",
                              background: "#FEE2E2",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontWeight: "bold",
                            }}
                          >
                            퇴사
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #E5E7EB",
                          color: "#10B981",
                          fontWeight: "bold",
                        }}
                      >
                        {s.checkedInCount}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #E5E7EB",
                          color: "#EF4444",
                          fontWeight: "bold",
                        }}
                      >
                        {s.noShowCount}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #E5E7EB",
                          color: "#3B82F6",
                          fontWeight: "bold",
                        }}
                      >
                        {s.absenceCount}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #E5E7EB",
                          fontWeight: "bold",
                        }}
                      >
                        {s.totalDays}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          borderBottom: "1px solid #E5E7EB",
                          fontWeight: "bold",
                          color:
                            s.totalDays > 0 &&
                            s.checkedInCount / s.totalDays >= 0.9
                              ? "#10B981"
                              : s.totalDays > 0 &&
                                s.checkedInCount / s.totalDays >= 0.7
                              ? "#F59E0B"
                              : "#EF4444",
                        }}
                      >
                        {s.totalDays > 0
                          ? `${((s.checkedInCount / s.totalDays) * 100).toFixed(
                              1
                            )}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
              평균 통계 ({queryMonth})
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, 1fr)"
                  : "repeat(4, 1fr)",
                gap: "15px",
                fontSize: "14px",
              }}
            >
              <div>
                <span style={{ color: "#666" }}>학생 수: </span>
                <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                  {monthStats.total}명
                </span>
              </div>
              <div>
                <span style={{ color: "#666" }}>평균 출석: </span>
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "18px",
                    color: "#10B981",
                  }}
                >
                  {monthStats.avgCheckedIn.toFixed(1)}일
                </span>
              </div>
              <div>
                <span style={{ color: "#666" }}>평균 미입실: </span>
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "18px",
                    color: "#EF4444",
                  }}
                >
                  {monthStats.avgNoShow.toFixed(1)}일
                </span>
              </div>
              <div>
                <span style={{ color: "#666" }}>평균 사유: </span>
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "18px",
                    color: "#3B82F6",
                  }}
                >
                  {monthStats.avgAbsent.toFixed(1)}일
                </span>
              </div>
            </div>
          </div>
        </>
      )}

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
