import { ImageResponse } from "next/og";

export const alt = "HBKR AI Positioning Survey — 나의 AI 활용 포지션 발견하기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const axes = [
  ["D", "DOMAIN"],
  ["W", "DEPTH"],
  ["R", "ROLE"],
  ["M", "MATURITY"],
] as const;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#efede6",
          color: "#171c19",
          padding: "58px 64px",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            left: -180,
            top: -260,
            borderRadius: 999,
            background: "#d8f06f",
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            right: -230,
            bottom: -280,
            borderRadius: 999,
            background: "#1e5b43",
            opacity: 0.12,
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  background: "#171c19",
                  color: "#d8f06f",
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                }}
              >
                HB
              </div>
              <div style={{ display: "flex", fontSize: 17, fontWeight: 800, letterSpacing: "0.13em" }}>
                HBKR
              </div>
            </div>
            <div
              style={{
                display: "flex",
                border: "1px solid #bbb8ae",
                borderRadius: 999,
                padding: "10px 17px",
                color: "#3d4943",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              5 MIN · 5 MISSIONS · INSTANT PROFILE
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 54 }}>
            <div style={{ display: "flex", width: 660, flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  color: "#1e5b43",
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  marginBottom: 18,
                }}
              >
                FIND YOUR AI POSITION
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 65,
                  fontWeight: 800,
                  letterSpacing: "-0.055em",
                  lineHeight: 1.08,
                }}
              >
                나의 AI 포지션은?
              </div>
              <div
                style={{
                  display: "flex",
                  width: 620,
                  marginTop: 22,
                  color: "#3d4943",
                  fontSize: 22,
                  lineHeight: 1.55,
                }}
              >
                일하는 방식의 모양으로 발견하는 AI 포지셔닝 설문
              </div>
            </div>

            <div
              style={{
                width: 348,
                display: "flex",
                flexDirection: "column",
                border: "1px solid #d9d6cc",
                borderRadius: 28,
                background: "#fbfaf6",
                padding: 26,
                boxShadow: "0 22px 60px rgba(30, 38, 33, 0.10)",
              }}
            >
              <div style={{ display: "flex", color: "#6b746f", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em" }}>
                YOUR POSITIONING SIGNALS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 19 }}>
                {axes.map(([letter, label]) => (
                  <div
                    key={letter}
                    style={{
                      width: 140,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      borderRadius: 13,
                      background: letter === "W" ? "#1e5b43" : "#edf1e9",
                      color: letter === "W" ? "#ffffff" : "#171c19",
                      padding: "13px 12px",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 999,
                        background: letter === "W" ? "#d8f06f" : "#ffffff",
                        color: "#133e2d",
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      {letter}
                    </div>
                    <div style={{ display: "flex", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 18,
                  borderRadius: 13,
                  background: "#d8f06f",
                  color: "#133e2d",
                  padding: "13px 15px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                AI 캐릭터 + 7일 실행 퀘스트
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", color: "#6b746f", fontSize: 14 }}>
              Domain × AI Depth × Role × Production Maturity
            </div>
            <div style={{ display: "flex", color: "#1e5b43", fontSize: 16, fontWeight: 800 }}>
              survey.hbkr.net →
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
