import { createContext, useContext, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";
import { fetchParticipants } from "../api/study";

const StompContext = createContext(null);

export function StompProvider({ children }) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const solveSubRef = useRef(null);

  const [status, setStatus] = useState("DISCONNECTED"); // DISCONNECTED | CONNECTING | CONNECTED | ERROR
  const [participants, setParticipants] = useState([]);
  const [startSignal, setStartSignal] = useState(0);
  const [solveState, setSolveState] = useState(null);

  const api = useMemo(() => {
    return {
      status,
      participants,
      startSignal,
      solveState,

      connectAndEnter(myUserId) {
        if (status === "CONNECTED" || status === "CONNECTING") return;

        setStatus("CONNECTING");

        const socket = new SockJS("/ws");
        const client = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 3000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: () => {},
          onWebSocketClose: () => setStatus("DISCONNECTED"),
          onWebSocketError: () => setStatus("ERROR"),
          onStompError: () => setStatus("ERROR"),
        });

        client.onConnect = () => {
          setStatus("CONNECTED");

          // 1) 먼저 구독
          subRef.current = client.subscribe("/topic/study", async (frame) => {
            const evt = JSON.parse(frame.body); // { type, participant }
            const p = evt.participant;

            setParticipants((prev) => {
              if (evt.type === "ENTER") {
                // 추가/갱신
                const exists = prev.some((x) => String(x.userId) === String(p.userId));
                if (exists) {
                  return prev.map((x) => (String(x.userId) === String(p.userId) ? p : x));
                }
                return [...prev, p];
              }

              if (evt.type === "LEAVE") {
                return prev.filter((x) => String(x.userId) !== String(p.userId));
              }

              if (evt.type === "READY") {
                return prev.map((x) => (String(x.userId) === String(p.userId) ? p : x));
              }

              if (evt.type === "START") {
                // 모든 클라이언트가 이 신호를 받으면 이동하도록
                setStartSignal(Date.now());
                return prev;
              }

              return prev;
            });

            // 3) 내 ENTER 이벤트가 돌아오면 axios로 전체 목록 동기화
            if (evt.type === "ENTER" && String(p.userId) === String(myUserId)) {
              try {
                const data = await fetchParticipants();
                setParticipants(data.participants || []);
              } catch (e) {
                console.error("fetchParticipants failed:", e);
              }
            }
          });

          solveSubRef.current = client.subscribe("/topic/solve", (frame) => {
            try {
              const evt = JSON.parse(frame.body); // { type, state }
              if (evt.type === "STATE") {
                setSolveState(evt.state);
              }
            } catch (e) {
              console.error("Invalid /topic/solve payload:", frame.body);
            }
          });

          // 2) 구독 후 입장 메시지 전송(요구사항 그대로)
          client.publish({ destination: "/app/study/enter", body: "" });
        };

        clientRef.current = client;
        client.activate();
      },

      sendLeave() {
        const client = clientRef.current;
        if (!client || status !== "CONNECTED") return;
        client.publish({ destination: "/app/study/leave", body: "" });
      },

      toggleReady() {
        const client = clientRef.current;
        if (!client || status !== "CONNECTED") return;
        client.publish({ destination: "/app/study/ready.toggle", body: "" });
      },

      disconnect() {
        try {
          subRef.current?.unsubscribe();
          solveSubRef.current?.unsubscribe();
        } catch (_) {}
        subRef.current = null;
        solveSubRef.current = null;
        setSolveState(null);

        const client = clientRef.current;
        if (client) {
          client.deactivate();
          clientRef.current = null;
        }

        setStatus("DISCONNECTED");
        setParticipants([]);
      },

      sendStart() {
        const client = clientRef.current;
        if (!client || status !== "CONNECTED") return;
        client.publish({ destination: "/app/study/start", body: "" });
      },

      clearStartSignal() {
        setStartSignal(0);
      },

      clearSolveState() {
        setSolveState(null);
      },

      sendSolveSync() {
        const client = clientRef.current;
        if (!client || status !== "CONNECTED") return;
        client.publish({ destination: "/app/solve/sync", body: "" });
      },

      sendSolveNext() {
        const client = clientRef.current;
        if (!client || status !== "CONNECTED") return;
        client.publish({ destination: "/app/solve/next", body: "" });
      },

      sendSolvePrev() {
        const client = clientRef.current;
        if (!client || status !== "CONNECTED") return;
        client.publish({ destination: "/app/solve/prev", body: "" });
      },
    };
  }, [status, participants, startSignal, solveState]);

  return <StompContext.Provider value={api}>{children}</StompContext.Provider>;
}

export function useStomp() {
  const ctx = useContext(StompContext);
  if (!ctx) throw new Error("useStomp must be used inside StompProvider");
  return ctx;
}