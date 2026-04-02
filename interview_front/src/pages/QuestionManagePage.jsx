import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import {
  createQuestion,
  deleteQuestion,
  fetchManageCategories,
  fetchManageQuestions,
  updateQuestionMeta,
  upsertMyAnswer,
} from "../api/questionManage";
import "../css/QuestionManagePage.css";

export default function QuestionManagePage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalType, setModalType] = useState(null); // add | meta | answer
  const [selected, setSelected] = useState(null);

  const [questionText, setQuestionText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [addDate, setAddDate] = useState("");
  const [myAnswer, setMyAnswer] = useState("");

  const [addAnswerTab, setAddAnswerTab] = useState("write");
  const [editAnswerTab, setEditAnswerTab] = useState("write");

  const categoryOptions = useMemo(() => categories ?? [], [categories]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [qData, cData] = await Promise.all([
        fetchManageQuestions(),
        fetchManageCategories(),
      ]);
      setQuestions(Array.isArray(qData) ? qData : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch (e) {
      setError(e?.response?.data?.message || "문제 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAddModal = () => {
    setSelected(null);
    setQuestionText("");
    setCategoryId(categoryOptions[0]?.id ?? "");
    setAddDate(new Date().toISOString().slice(0, 10));
    setMyAnswer("");
    setAddAnswerTab("write");
    setModalType("add");
  };

  const openMetaModal = (row) => {
    setSelected(row);
    setQuestionText(row.question || "");
    setCategoryId(row.categoryId ?? "");
    setAddDate(row.addDate ?? new Date().toISOString().slice(0, 10));
    setMyAnswer("");
    setModalType("meta");
  };

  const openAnswerModal = (row) => {
    setSelected(row);
    setQuestionText("");
    setCategoryId("");
    setAddDate("");
    setMyAnswer(row.myAnswer || "");
    setEditAnswerTab("write");
    setModalType("answer");
  };

  const closeModal = () => {
    setModalType(null);
    setSelected(null);
    setQuestionText("");
    setCategoryId("");
    setAddDate("");
    setMyAnswer("");
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    await createQuestion({
      question: questionText,
      categoryId: Number(categoryId),
      addDate,
      myAnswer,
    });
    closeModal();
    await loadAll();
  };

  const submitMeta = async (e) => {
    e.preventDefault();
    await updateQuestionMeta(selected.questionId, {
      question: questionText,
      categoryId: Number(categoryId),
      addDate,
    });
    closeModal();
    await loadAll();
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    await upsertMyAnswer(selected.questionId, { myAnswer });
    closeModal();
    await loadAll();
  };

  const onDelete = async (questionId) => {
    const ok = window.confirm("정말 삭제할까요? 삭제하면 되돌릴 수 없습니다.");
    if (!ok) return;
    await deleteQuestion(questionId);
    await loadAll();
  };

  return (
    <div className="qm-page">
      <header className="qm-header">
        <h1>문제 관리</h1>
        <div className="qm-actions">
          <button onClick={() => navigate("/")}>모드 선택으로</button>
          <button className="qm-primary" onClick={openAddModal}>
            문제 추가
          </button>
        </div>
      </header>

      {error && <div className="qm-error">{error}</div>}

      {loading ? (
        <div className="qm-loading">불러오는 중...</div>
      ) : questions.length === 0 ? (
        <div className="qm-empty">문제가 없습니다.</div>
      ) : (
        <div className="qm-list">
          {questions.map((q) => {
            const hasAnswer = !!q.myAnswer?.trim();
            return (
              <div key={q.questionId} className="qm-row">
                <div className="qm-main">
                  <div className="qm-title">{q.question}</div>
                  <div className="qm-meta">
                    카테고리: {q.categoryName || "미지정"} / 학습일자: {q.addDate || "미지정"}
                  </div>
                </div>
                <div className="qm-row-actions">
                  <button onClick={() => openMetaModal(q)}>문제 수정</button>
                  <button
                    className={hasAnswer ? "qm-answer-edit" : "qm-answer-register"}
                    onClick={() => openAnswerModal(q)}
                  >
                    {hasAnswer ? "답안 수정" : "답안 등록"}
                  </button>
                  <button className="qm-delete" onClick={() => onDelete(q.questionId)}>
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalType && (
        <div className="qm-modal-backdrop" onClick={closeModal}>
          <div className="qm-modal" onClick={(e) => e.stopPropagation()}>
            {modalType === "add" && (
              <form onSubmit={submitAdd}>
                <h2>문제 추가</h2>
                <label>문제명</label>
                <input value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
                <label>카테고리</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="" disabled>
                    카테고리 선택
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label>학습일자</label>
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} required />

                <label>내 답변</label>
                <EditorTabs tab={addAnswerTab} onChange={setAddAnswerTab} />
                {addAnswerTab === "write" ? (
                  <textarea
                    className="qm-answer-textarea"
                    value={myAnswer}
                    onChange={(e) => setMyAnswer(e.target.value)}
                    rows={6}
                  />
                ) : (
                  <MarkdownPreview value={myAnswer} />
                )}

                <ModalButtons onCancel={closeModal} submitText="추가" />
              </form>
            )}

            {modalType === "meta" && (
              <form onSubmit={submitMeta}>
                <h2>제목/카테고리 수정</h2>
                <label>문제명</label>
                <input value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
                <label>카테고리</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="" disabled>
                    카테고리 선택
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label>학습일자</label>
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} required />
                <ModalButtons onCancel={closeModal} submitText="수정" />
              </form>
            )}

            {modalType === "answer" && (
              <form onSubmit={submitAnswer}>
                <h2>답안 {selected?.myAnswer?.trim() ? "수정" : "등록"}</h2>
                <label>내 답변</label>
                <EditorTabs tab={editAnswerTab} onChange={setEditAnswerTab} />
                {editAnswerTab === "write" ? (
                  <textarea
                    className="qm-answer-textarea"
                    value={myAnswer}
                    onChange={(e) => setMyAnswer(e.target.value)}
                    rows={8}
                    required
                  />
                ) : (
                  <MarkdownPreview value={myAnswer} />
                )}
                <ModalButtons
                  onCancel={closeModal}
                  submitText={selected?.myAnswer?.trim() ? "답안 수정" : "답안 등록"}
                />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditorTabs({ tab, onChange }) {
  return (
    <div className="qm-editor-tabs">
      <button
        type="button"
        className={tab === "write" ? "active" : ""}
        onClick={() => onChange("write")}
      >
        작성
      </button>
      <button
        type="button"
        className={tab === "preview" ? "active" : ""}
        onClick={() => onChange("preview")}
      >
        미리보기
      </button>
    </div>
  );
}

function MarkdownPreview({ value }) {
  if (!value?.trim()) {
    return <div className="qm-preview-empty">미리볼 내용이 없습니다.</div>;
  }

  return (
    <div className="qm-preview-box">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{value}</ReactMarkdown>
    </div>
  );
}

function ModalButtons({ onCancel, submitText }) {
  return (
    <div className="qm-modal-buttons">
      <button type="button" onClick={onCancel}>
        취소
      </button>
      <button type="submit" className="qm-primary">
        {submitText}
      </button>
    </div>
  );
}