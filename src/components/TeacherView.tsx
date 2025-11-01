import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, User, Seat, Reservation, Absence } from "../App";

interface TeacherViewProps {
  loggedInUser: User | null;
  students: Student[];
  seats: Seat[];
  reservations: Reservation[];
  absences: Absence[];
  currentDate: string;
  onDataChange: () => void;
}

const TeacherView: React.FC<TeacherViewProps> = ({
  loggedInUser,
  students,
  seats,
  reservations,
  absences,
  currentDate,
  onDataChange,
}) => {
  const [selectedGrade, setSelectedGrade] = useState(2);
  const [selectedClass, setSelectedClass] = useState(1);
  const [absenceData, setAbsenceData] = useState<{
    [key: string]: { reason: string; note: string };
  }>({});
  const [assigningSeats, setAssigningSeats] = useState(false);
  const [seatAssignments, setSeatAssignments] = useState<{
    [key: string]: string;
  }>({});
  const [isComposing, setIsComposing] = useState(false);

  if (!loggedInUser || loggedInUser.role !== "teacher") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>교사 로그인이 필요합니다.</p>
      </div>
    );
  }

  const classStudents = students.filter(
    (s) => s.grade === selectedGrade && s.class === selectedClass
  );

  const studentsWithStatus = classStudents.map((s) => {
    const reservation = reservations.find(
      (r) => r.student_id === s.id && r.date === currentDate
    );
    const absence = absences.find(
      (a) => a.student_id === s.id && a.date === currentDate
    );
    return {
      ...s,
      reservation,
      absence,
      hasReservation: !!reservation,
      isNoShow: reservation?.status === "미입실",
      hasAbsence: !!absence,
    };
  });

  const handleSaveAll = async () => {
    try {
      const newAbsences = Object.entries(absenceData)
        .filter(([_, data]) => data.reason)
        .map(([studentId, data]) => ({
          student_id: studentId,
          date: currentDate,
          reason: data.reason,
          note: data.note || "",
        }));

      if (newAbsences.length === 0) {
        alert("입력된 사유가 없습니다.");
        return;
      }

      const studentIds = newAbsences.map((a) => a.student_id);

      // 기존 사유 삭제
      await supabase
        .from("absences")
        .delete()
        .in("student_id", studentIds)
        .eq("date", currentDate);

      // 새 사유 삽입
      const { error } = await supabase.from("absences").insert(newAbsences);

      if (error) throw error;

      alert(`${newAbsences.length}명의 사유가 저장되었습니다.`);
      setAbsenceData({});
      await onDataChange();
    } catch (error) {
      console.error("사유 저장 오류:", error);
      alert("사유 저장에 실패했습니다.");
    }
  };

  const handleNoShowCheck = async () => {
    try {
      const reservationsToUpdate = reservations
        .filter((r) => r.date === currentDate && r.status === "예약")
        .map((r) => r.id);

      if (reservationsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("reservations")
          .update({ status: "미입실" })
          .in("id", reservationsToUpdate);

        if (updateError) throw updateError;
      }

      const studentsToAdd = classStudents.filter((s) => {
        const hasReservation = reservations.find(
          (r) => r.student_id === s.id && r.date === currentDate
        );
        const hasAbsence = absences.find(
          (a) => a.student_id === s.id && a.date === currentDate
        );
        return !hasReservation && !hasAbsence;
      });

      if (studentsToAdd.length > 0) {
        const newReservations = studentsToAdd.map((s) => ({
          student_id: s.id,
          seat_id: null,
          date: currentDate,
          status: "미입실",
          check_in_time: null,
        }));

        const { error: insertError } = await supabase
          .from("reservations")
          .insert(newReservations);

        if (insertError) throw insertError;
      }

      alert("미입실 일괄 체크가 완료되었습니다.");
      await onDataChange();
    } catch (error) {
      console.error("미입실 체크 오류:", error);
      alert("미입실 체크에 실패했습니다.");
    }
  };

  const handleSaveSeats = async () => {
    try {
      const updates = Object.entries(seatAssignments).map(
        ([studentId, seatId]) => ({
          id: studentId,
          fixed_seat_id: seatId || null,
        })
      );

      if (updates.length === 0) {
        alert("변경된 좌석이 없습니다.");
        return;
      }

      const seatIds = updates
        .map((u) => u.fixed_seat_id)
        .filter((id) => id !== null);
      const uniqueSeatIds = new Set(seatIds);

      if (seatIds.length !== uniqueSeatIds.size) {
        alert("같은 좌석을 여러 학생에게 배정할 수 없습니다.");
        return;
      }

      // ✅ upsert 대신 update 사용 (각각 개별 업데이트)
      for (const update of updates) {
        const { error } = await supabase
          .from("students")
          .update({ fixed_seat_id: update.fixed_seat_id })
          .eq("id", update.id);

        if (error) throw error;
      }

      alert(`${updates.length}명의 좌석 배정이 완료되었습니다.`);
      setSeatAssignments({});
      setAssigningSeats(false);
      await onDataChange();
    } catch (error) {
      console.error("좌석 배정 오류:", error);
      alert("좌석 배정에 실패했습니다.");
    }
  };

  const handleClearAllSeats = async () => {
    if (!window.confirm("모든 학생의 고정 좌석을 해제하시겠습니까?")) {
      return;
    }

    try {
      // ✅ 각 학생별로 개별 업데이트
      for (const student of classStudents) {
        const { error } = await supabase
          .from("students")
          .update({ fixed_seat_id: null })
          .eq("id", student.id);

        if (error) throw error;
      }

      alert("모든 고정 좌석이 해제되었습니다.");
      setSeatAssignments({});
      await onDataChange();
    } catch (error) {
      console.error("좌석 해제 오류:", error);
      alert("좌석 해제에 실패했습니다.");
    }
  };
  const isMobile = window.innerWidth < 768;

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
          교사 관리 페이지
        </h1>
        <button
          onClick={() => {
            setAssigningSeats(!assigningSeats);
            if (!assigningSeats) {
              const currentAssignments: { [key: string]: string } = {};
              classStudents.forEach((s) => {
                if (s.fixed_seat_id) {
                  currentAssignments[s.id] = s.fixed_seat_id;
                }
              });
              setSeatAssignments(currentAssignments);
            }
          }}
          style={{
            padding: "10px 20px",
            background: assigningSeats ? "#EF4444" : "#10B981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {assigningSeats ? "❌ 취소" : "📌 좌석 고정 배정"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <select
          value={selectedGrade}
          onChange={(e) => {
            setSelectedGrade(Number(e.target.value));
            setSeatAssignments({});
          }}
          style={{
            padding: "12px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            flex: "1",
          }}
        >
          <option value={2}>2학년</option>
          <option value={3}>3학년</option>
        </select>
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(Number(e.target.value));
            setSeatAssignments({});
          }}
          style={{
            padding: "12px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            flex: "1",
          }}
        >
          <option value={1}>1반</option>
          <option value={2}>2반</option>
          <option value={3}>3반</option>
          <option value={4}>4반</option>
        </select>
      </div>

      {/* 좌석 고정 배정 모드 */}
      {assigningSeats && (
        <div
          style={{
            background: "#FEF3C7",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "2px solid #F59E0B",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
              📌 좌석 고정 배정 ({selectedGrade}학년 {selectedClass}반)
            </h3>
            <button
              onClick={handleClearAllSeats}
              style={{
                padding: "8px 15px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              전체 해제
            </button>
          </div>

          <div
            style={{
              background: "#FFFBEB",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            💡 <strong>고정 좌석</strong>: 학생이 예약 시 자동으로 선택되는
            좌석입니다.
          </div>

          {studentsWithStatus.map((s) => {
            const currentSeat =
              seatAssignments[s.id] !== undefined
                ? seatAssignments[s.id]
                : s.fixed_seat_id || "";

            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center",
                  gap: "12px",
                  padding: "12px",
                  background: "white",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  border: currentSeat ? "2px solid #10B981" : "1px solid #ddd",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    minWidth: "120px",
                    fontSize: "14px",
                  }}
                >
                  {s.number}번 {s.name}
                  {s.fixed_seat_id && !seatAssignments[s.id] && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#10B981",
                        marginLeft: "5px",
                      }}
                    >
                      (현재: {s.fixed_seat_id})
                    </span>
                  )}
                </div>

                <select
                  value={currentSeat}
                  onChange={(e) =>
                    setSeatAssignments({
                      ...seatAssignments,
                      [s.id]: e.target.value,
                    })
                  }
                  style={{
                    flex: "1",
                    padding: "10px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: currentSeat ? "#F0FDF4" : "white",
                  }}
                >
                  <option value="">좌석 미지정</option>
                  {seats
                    .filter((seat) => seat.grade === s.grade)
                    .map((seat) => {
                      const isAssignedToOther = Object.entries(
                        seatAssignments
                      ).some(
                        ([studentId, seatId]) =>
                          studentId !== s.id && seatId === seat.id
                      );

                      const isCurrentlyFixed =
                        !isAssignedToOther &&
                        students.some(
                          (st) => st.id !== s.id && st.fixed_seat_id === seat.id
                        );

                      return (
                        <option
                          key={seat.id}
                          value={seat.id}
                          disabled={isAssignedToOther || isCurrentlyFixed}
                          style={{
                            color:
                              isAssignedToOther || isCurrentlyFixed
                                ? "#ccc"
                                : "black",
                          }}
                        >
                          {seat.type} {seat.number}번
                          {isAssignedToOther && " (선택됨)"}
                          {isCurrentlyFixed && " (배정됨)"}
                        </option>
                      );
                    })}
                </select>

                {currentSeat && (
                  <button
                    onClick={() => {
                      const newAssignments = { ...seatAssignments };
                      newAssignments[s.id] = "";
                      setSeatAssignments(newAssignments);
                    }}
                    style={{
                      padding: "8px 12px",
                      background: "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    해제
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleSaveSeats}
            style={{
              width: "100%",
              padding: "15px",
              background: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "15px",
            }}
          >
            좌석 배정 저장 (
            {
              Object.entries(seatAssignments).filter(
                ([id, seat]) =>
                  seat !==
                  studentsWithStatus.find((s) => s.id === id)?.fixed_seat_id
              ).length
            }
            명 변경)
          </button>
        </div>
      )}

      {/* 사유 입력 영역 */}
      {!assigningSeats && (
        <>
          <div
            style={{
              border: "2px solid #ddd",
              borderRadius: "12px",
              padding: "15px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              {selectedGrade}학년 {selectedClass}반 ({classStudents.length}명)
            </h3>

            <div style={{ marginBottom: "15px" }}>
              {studentsWithStatus.map((s) => {
                const bgColor =
                  s.reservation?.status === "입실완료"
                    ? "#D1FAE5"
                    : s.isNoShow
                    ? "#FEE2E2"
                    : !s.hasReservation && !s.hasAbsence
                    ? "#FED7AA"
                    : s.hasAbsence
                    ? "#DBEAFE"
                    : "#FEF3C7";

                const currentReason =
                  absenceData[s.id]?.reason || s.absence?.reason || "";
                const currentNote =
                  absenceData[s.id]?.note || s.absence?.note || "";

                const canEditReason =
                  s.reservation?.status !== "입실완료" &&
                  s.reservation?.status !== "예약";

                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "center",
                      gap: isMobile ? "10px" : "12px",
                      padding: "12px",
                      background: bgColor,
                      borderRadius: "8px",
                      marginBottom: "8px",
                      opacity: canEditReason ? 1 : 0.6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        minWidth: isMobile ? "100%" : "180px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {s.number}번 {s.name}
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
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: "white",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.reservation?.status === "입실완료"
                          ? "✓ 입실"
                          : s.isNoShow
                          ? "⚠ 미입실"
                          : s.hasReservation
                          ? "예약"
                          : "미예약"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "repeat(2, 1fr)"
                          : "repeat(4, 1fr)",
                        gap: "6px",
                        flex: "1",
                      }}
                    >
                      {["기숙사", "교내", "교외", "기타"].map((reason) => (
                        <button
                          key={reason}
                          onClick={() => {
                            if (!canEditReason) return;

                            // 같은 버튼을 다시 클릭하면 해제
                            if (currentReason === reason) {
                              const newData = { ...absenceData };
                              delete newData[s.id];
                              setAbsenceData(newData);
                            } else {
                              // 새로운 사유 선택
                              setAbsenceData({
                                ...absenceData,
                                [s.id]: {
                                  reason,
                                  note: currentNote,
                                },
                              });
                            }
                          }}
                          disabled={!canEditReason}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            border:
                              currentReason === reason
                                ? "none"
                                : "1px solid #ddd",
                            background:
                              currentReason === reason ? "#3B82F6" : "white",
                            color:
                              currentReason === reason
                                ? "white"
                                : canEditReason
                                ? "black"
                                : "#ccc",
                            cursor: canEditReason ? "pointer" : "not-allowed",
                            fontWeight:
                              currentReason === reason ? "bold" : "normal",
                          }}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => {
                        if (!canEditReason) return;
                        setAbsenceData({
                          ...absenceData,
                          [s.id]: {
                            reason: currentReason,
                            note: e.target.value,
                          },
                        });
                      }}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => setIsComposing(false)}
                      disabled={!canEditReason}
                      placeholder={canEditReason ? "상세 사유" : ""}
                      style={{
                        flex: isMobile ? "1" : "0 0 150px",
                        padding: "8px 10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontSize: "13px",
                        background: canEditReason ? "white" : "#f5f5f5",
                        cursor: canEditReason ? "text" : "not-allowed",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "12px",
            }}
          >
            <button
              onClick={handleSaveAll}
              style={{
                flex: "1",
                padding: "15px",
                background: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              일괄 저장 (
              {
                Object.keys(absenceData).filter((k) => absenceData[k]?.reason)
                  .length
              }
              건)
            </button>
            <button
              onClick={handleNoShowCheck}
              style={{
                padding: "15px 25px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              미입실 체크
            </button>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#F3F4F6",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
                fontSize: "14px",
              }}
            >
              💡 색상 안내:
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, 1fr)"
                  : "repeat(5, 1fr)",
                gap: "10px",
                fontSize: "13px",
              }}
            >
              {[
                { color: "#D1FAE5", label: "입실완료" },
                { color: "#FEF3C7", label: "예약중" },
                { color: "#FEE2E2", label: "미입실" },
                { color: "#FED7AA", label: "미예약" },
                { color: "#DBEAFE", label: "사유입력" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      background: item.color,
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  ></div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherView;
