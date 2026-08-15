"use client";

import { ChangeEvent, CSSProperties, DragEvent, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

type ThemeId = "manuscript" | "illustration" | "chat" | "framed" | "letter";
type EditorTab = "content" | "style";
type ChatSkin = "instagram" | "imessage" | "kakao" | "discord";
type IllustrationFit = "cover" | "contain";
type HighlightStyle = "none" | "thin" | "thick" | "solid" | "underline";
type AspectId = "auto" | "portrait" | "story" | "square" | "landscape" | "wide";

type IllustrationItem = {
  id: string;
  src: string;
  after: number;
  width: number;
  height: number;
  topGap: number;
  bottomGap: number;
  positionX: number;
  positionY: number;
  fit: IllustrationFit;
};

const themes: Array<{ id: ThemeId; index: string; name: string; description: string }> = [
  { id: "manuscript", index: "01", name: "기본 원고", description: "읽기에 집중한 긴 글" },
  { id: "illustration", index: "02", name: "삽화 노트", description: "문단 사이에 삽화를 배치" },
  { id: "chat", index: "03", name: "채팅 앱", description: "실제 메신저 화면처럼" },
  { id: "framed", index: "04", name: "배경 프레임", description: "사진이나 색 위에 원고 한 장" },
  { id: "letter", index: "05", name: "줄노트 편지", description: "손으로 쓴 노트처럼" },
];

const fonts = [
  { id: "serif", name: "차분한 명조", value: '"Iowan Old Style", "Batang", serif' },
  { id: "sans", name: "깔끔한 고딕", value: 'Arial, "Apple SD Gothic Neo", sans-serif' },
  { id: "book", name: "클래식 본문", value: 'Georgia, "Nanum Myeongjo", serif' },
  { id: "mono", name: "타자기", value: '"Courier New", monospace' },
  { id: "noto-sans", name: "Noto Sans KR · 무료", value: '"Noto Sans KR", sans-serif' },
  { id: "noto-serif", name: "Noto Serif KR · 무료", value: '"Noto Serif KR", serif' },
  { id: "gowun-batang", name: "고운바탕 · 무료", value: '"Gowun Batang", serif' },
  { id: "gowun-dodum", name: "고운돋움 · 무료", value: '"Gowun Dodum", sans-serif' },
  { id: "nanum-myeongjo", name: "나눔명조 · 무료", value: '"Nanum Myeongjo", serif' },
  { id: "nanum-pen", name: "나눔펜 · 무료", value: '"Nanum Pen Script", cursive' },
  { id: "song-myung", name: "송명 · 무료", value: '"Song Myung", serif' },
  { id: "black-han", name: "검은고딕 · 무료", value: '"Black Han Sans", sans-serif' },
];

const chatSkins: Array<{ id: ChatSkin; name: string; badge: string }> = [
  { id: "instagram", name: "인스타 DM", badge: "◎" },
  { id: "imessage", name: "아이폰 메시지", badge: "●" },
  { id: "kakao", name: "카카오톡", badge: "K" },
  { id: "discord", name: "디스코드", badge: "D" },
];

const aspectPresets: Record<AspectId, { name: string; ratio: string; width: number; minHeight: number; outputWidth: number }> = {
  auto: { name: "내용 맞춤", ratio: "AUTO", width: 680, minHeight: 0, outputWidth: 1080 },
  portrait: { name: "세로", ratio: "3:4", width: 720, minHeight: 960, outputWidth: 1200 },
  story: { name: "스토리", ratio: "9:16", width: 640, minHeight: 1138, outputWidth: 1080 },
  square: { name: "정사각", ratio: "1:1", width: 880, minHeight: 880, outputWidth: 1200 },
  landscape: { name: "가로", ratio: "3:2", width: 1080, minHeight: 720, outputWidth: 1500 },
  wide: { name: "와이드", ratio: "16:9", width: 1120, minHeight: 630, outputWidth: 1600 },
};

const palettes = [
  { name: "Paper", bg: "#ffffff", fg: "#222222", accent: "#ffe781" },
  { name: "Cream", bg: "#fff9ec", fg: "#3d342a", accent: "#f2c879" },
  { name: "Peach", bg: "#fff0ea", fg: "#442e2a", accent: "#ffb49f" },
  { name: "Mint", bg: "#edf8f2", fg: "#213c32", accent: "#9ee1bf" },
  { name: "Sky", bg: "#edf5ff", fg: "#23354e", accent: "#a8ccff" },
  { name: "Lilac", bg: "#f5f0ff", fg: "#372c4b", accent: "#cbb5ff" },
  { name: "Sepia", bg: "#f3eadc", fg: "#3a3028", accent: "#d9b48f" },
  { name: "Night", bg: "#202226", fg: "#f3f3f0", accent: "#65779d" },
];

const initialTitle = "비가 그친 뒤, 우리는 오래 걸었다.";
const initialDate = new Date().toLocaleDateString("en-CA");
const initialBody = `창문을 타고 흐르던 빗물이 멎자 방 안은 이상할 만큼 조용해졌다. 나는 한참 뒤에야 네가 남긴 마지막 문장을 다시 읽었다.

“잊지 않아도 괜찮아. 다만 아프지 않게 기억해.”

그 한마디는 여름밤의 희미한 조명처럼 페이지 위에 남았다. 기록은 사라지는 것을 붙잡는 일이 아니라, 언젠가 다시 펼쳐 볼 수 있도록 자리를 내어 주는 일인지도 모른다.

“그러면 우리, 오늘 있었던 일부터 천천히 적어 볼까?”

나는 대답 대신 새 문서를 열었다. 빈 화면은 눈이 부셨고, 커서는 오래 기다려 줄 것처럼 조용히 깜빡였다.`;

const isQuoteBlock = (text: string) => {
  const trimmed = text.trim();
  return /^[“"][\s\S]+[”"]$/.test(trimmed) || /^[‘'][\s\S]+[’']$/.test(trimmed);
};

const stripQuote = (text: string) => text.trim().replace(/^[“"‘']|[”"’']$/g, "");

function highlightQuotes(text: string, enabled: boolean, style: HighlightStyle): ReactNode {
  if (!enabled || style === "none") return text;
  const pieces = text.split(/([“"][^”"\n]+[”"]|[‘'][^’'\n]+[’'])/g);
  return pieces.map((piece, index) => isQuoteBlock(piece)
    ? <mark className={`inline-highlight highlight-${style}`} key={`${piece}-${index}`}>{piece}</mark>
    : piece);
}

function ProfileAvatar({ src, name, className = "" }: { src: string | null; name: string; className?: string }) {
  return src
    ? <img className={`profile-avatar ${className}`} src={src} alt={`${name} 프로필`} />
    : <span className={`profile-avatar avatar-fallback ${className}`}>{name.trim().slice(0, 1) || "?"}</span>;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export default function Home() {
  const [theme, setTheme] = useState<ThemeId>("manuscript");
  const [tab, setTab] = useState<EditorTab>("content");
  const [title, setTitle] = useState(initialTitle);
  const [showTitle, setShowTitle] = useState(true);
  const [body, setBody] = useState(initialBody);
  const [author, setAuthor] = useState("기록");
  const [recordDate, setRecordDate] = useState(initialDate);
  const [letterFrom, setLetterFrom] = useState("");
  const [fontId, setFontId] = useState("serif");
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(2.02);
  const [sidePadding, setSidePadding] = useState(68);
  const [background, setBackground] = useState("#ffffff");
  const [foreground, setForeground] = useState("#222222");
  const [accent, setAccent] = useState("#ffe781");
  const [autoQuote, setAutoQuote] = useState(true);
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>("thin");
  const [illustrations, setIllustrations] = useState<IllustrationItem[]>([]);
  const [selectedIllustrationId, setSelectedIllustrationId] = useState<string | null>(null);
  const [frameImage, setFrameImage] = useState<string | null>(null);
  const [frameColor, setFrameColor] = useState("#78b9d4");
  const [chatSkin, setChatSkin] = useState<ChatSkin>("imessage");
  const [characterA, setCharacterA] = useState("상대방");
  const [characterB, setCharacterB] = useState("나");
  const [chatReversed, setChatReversed] = useState(false);
  const [profileA, setProfileA] = useState<string | null>(null);
  const [profileB, setProfileB] = useState<string | null>(null);
  const [aspect, setAspect] = useState<AspectId>("auto");
  const [zoom, setZoom] = useState(78);
  const [fitScale, setFitScale] = useState(1);
  const [status, setStatus] = useState("입력 내용은 저장되지 않아요");
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const frameUploadRef = useRef<HTMLInputElement>(null);
  const profileARef = useRef<HTMLInputElement>(null);
  const profileBRef = useRef<HTMLInputElement>(null);

  const selectedFont = fonts.find((font) => font.id === fontId) ?? fonts[0];
  const selectedAspect = aspectPresets[aspect];
  const blocks = useMemo(() => body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean), [body]);
  const quoteCount = useMemo(() => (body.match(/[“"][^”"\n]+[”"]/g) ?? []).length, [body]);
  const charCount = body.replace(/\s/g, "").length;
  const selectedIllustration = illustrations.find((item) => item.id === selectedIllustrationId) ?? null;

  useEffect(() => {
    setIllustrations((items) => items.map((item) => ({ ...item, after: Math.min(item.after, blocks.length) })));
  }, [blocks.length]);

  useEffect(() => {
    localStorage.removeItem("logmaker-draft-v1");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void exportImage();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useLayoutEffect(() => {
    if (aspect === "auto") {
      setFitScale(1);
      return;
    }
    const frame = requestAnimationFrame(() => {
      const content = contentRef.current;
      const container = content?.parentElement;
      if (!content || !container) return;
      const styles = getComputedStyle(container);
      const availableHeight = container.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
      let scale = 1;
      content.style.transform = "none";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        content.style.width = `${100 / scale}%`;
        const next = Math.max(.12, Math.min(1, availableHeight / Math.max(1, content.scrollHeight)));
        if (Math.abs(next - scale) < .005) {
          scale = next;
          break;
        }
        scale = next;
      }
      content.style.removeProperty("width");
      content.style.removeProperty("transform");
      setFitScale(scale);
    });
    return () => cancelAnimationFrame(frame);
  }, [aspect, selectedAspect.width, selectedAspect.minHeight, theme, title, showTitle, body, author, recordDate, letterFrom, fontId, fontSize, lineHeight, sidePadding, illustrations, frameImage, chatSkin, characterA, characterB, chatReversed]);

  const readImage = (event: ChangeEvent<HTMLInputElement>, setter: (value: string | null) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setStatus("8MB 이하 이미지를 선택해 주세요");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  const updateIllustration = (id: string, patch: Partial<Omit<IllustrationItem, "id" | "src">>) => {
    setIllustrations((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const removeIllustration = (id: string) => {
    const next = illustrations.filter((item) => item.id !== id);
    setIllustrations(next);
    if (selectedIllustrationId === id) setSelectedIllustrationId(next[0]?.id ?? null);
    setStatus("삽화를 삭제했어요");
  };

  const readIllustrations = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const accepted = files.filter((file) => file.size <= 8 * 1024 * 1024);
    if (!accepted.length) {
      setStatus("각 이미지가 8MB 이하인지 확인해 주세요");
      return;
    }
    let sources: string[];
    try {
      sources = await Promise.all(accepted.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      })));
    } catch {
      setStatus("일부 이미지를 읽지 못했어요. 다른 파일로 시도해 주세요");
      return;
    }
    const created = sources.map((src, index): IllustrationItem => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
      src,
      after: Math.min(index, blocks.length),
      width: 100,
      height: 300,
      topGap: 34,
      bottomGap: 42,
      positionX: 50,
      positionY: 50,
      fit: "cover",
    }));
    setIllustrations((items) => [...items, ...created]);
    setSelectedIllustrationId(created[0]?.id ?? null);
    setStatus(`${created.length}장의 삽화를 추가했어요${accepted.length < files.length ? " · 8MB 초과 파일은 제외했어요" : ""}`);
  };

  const exportImage = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    setStatus(`${selectedAspect.ratio} 이미지로 만드는 중…`);
    let exportNode: HTMLElement | null = null;
    let exportHost: HTMLDivElement | null = null;
    try {
      const node = previewRef.current;
      await document.fonts.ready;
      exportNode = node.cloneNode(true) as HTMLElement;
      exportNode.style.width = `${selectedAspect.width}px`;
      exportNode.style.minHeight = aspect === "auto" ? "0" : `${selectedAspect.minHeight}px`;
      exportNode.style.height = "auto";
      exportNode.style.zoom = "1";
      exportNode.style.margin = "0";
      exportNode.style.boxShadow = "none";
      exportHost = document.createElement("div");
      exportHost.className = "export-host";
      exportHost.appendChild(exportNode);
      document.body.appendChild(exportHost);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const exportRect = exportNode.getBoundingClientRect();
      const exportStyles = getComputedStyle(exportNode);
      let closingPadding = Number.parseFloat(exportStyles.paddingBottom) || 0;
      if (theme === "chat") {
        const stream = exportNode.querySelector<HTMLElement>(".chat-stream");
        if (stream) closingPadding += Number.parseFloat(getComputedStyle(stream).paddingBottom) || 0;
      }
      if (theme === "framed") {
        const sheet = exportNode.querySelector<HTMLElement>(".framed-sheet");
        if (sheet) closingPadding += Number.parseFloat(getComputedStyle(sheet).paddingBottom) || 0;
      }
      const contentNodes = Array.from(exportNode.querySelectorAll<HTMLElement>(
        ".paper-meta, h2, .letter-to, .prose-body p, .illustration-placed, .image-placeholder, .chat-app-header, .chat-time, .chat-line, .chat-narration, .letter-sign",
      ));
      const contentBottom = contentNodes.reduce((bottom, element) => {
        const rect = element.getBoundingClientRect();
        const marginBottom = Math.max(0, Number.parseFloat(getComputedStyle(element).marginBottom) || 0);
        return Math.max(bottom, rect.bottom - exportRect.top + marginBottom);
      }, 0);
      const fittedHeight = contentBottom > 0 ? contentBottom + closingPadding : exportNode.scrollHeight;
      const naturalHeight = aspect === "auto" ? Math.max(1, Math.ceil(fittedHeight)) : selectedAspect.minHeight;
      const desiredRatio = selectedAspect.outputWidth / selectedAspect.width;
      const pixelRatio = Math.max(1, Math.min(desiredRatio, 30000 / naturalHeight));
      const exportBackground = theme === "chat" && chatSkin === "discord" ? "#313338" : theme === "framed" ? frameColor : background;
      const dataUrl = await toPng(exportNode, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: exportBackground,
        width: selectedAspect.width,
        height: naturalHeight,
        filter: (element) => !(element instanceof HTMLElement && element.dataset.previewOnly === "true"),
        style: { position: "static", left: "auto", top: "auto", margin: "0", boxShadow: "none", zoom: "1", width: `${selectedAspect.width}px`, minHeight: aspect === "auto" ? "0" : `${selectedAspect.minHeight}px`, height: `${naturalHeight}px` },
      });
      const baseName = `${title.trim() || "logmaker-chat"}-${selectedAspect.ratio.replace(":", "x")}`;
      const response = await fetch(dataUrl);
      downloadBlob(await response.blob(), `${baseName}.png`);
      setStatus(aspect === "auto" ? "긴 PNG 한 장으로 저장했어요" : `${selectedAspect.ratio} 한 페이지 PNG로 저장했어요`);
    } catch {
      setStatus("이미지를 만들지 못했어요. 삽화 용량을 줄여 보세요");
    } finally {
      exportHost?.remove();
      setIsExporting(false);
    }
  };

  const chooseAspect = (id: AspectId) => {
    const preset = aspectPresets[id];
    setAspect(id);
    const availableWidth = Math.max(320, (canvasRef.current?.clientWidth ?? preset.width) - 68);
    setZoom(Math.max(40, Math.min(100, Math.floor((availableWidth / preset.width) * 100))));
    setStatus(`${preset.ratio} 비율을 미리 보는 중`);
  };

  const renderProse = (items: string[], startIndex = 0) => <div className="prose-body">{items.map((block, index) => (
    <p className={autoQuote && isQuoteBlock(block) ? "quote-block" : ""} key={`${block}-${startIndex + index}`}>
      {highlightQuotes(block, autoQuote, highlightStyle)}
    </p>
  ))}</div>;

  const renderIllustration = (item: IllustrationItem, index: number) => <div
    className="illustration-placed"
    key={item.id}
    style={{
      "--illustration-width": `${item.width}%`,
      "--illustration-height": `${item.height}px`,
      "--illustration-top-gap": `${item.topGap}px`,
      "--illustration-bottom-gap": `${item.bottomGap}px`,
      "--illustration-position-x": `${item.positionX}%`,
      "--illustration-position-y": `${item.positionY}%`,
      "--illustration-fit": item.fit,
    } as CSSProperties}
  ><img className="inserted-image" src={item.src} alt={`사용자가 삽입한 장면 ${index + 1}`} /></div>;

  const moveIllustration = (event: DragEvent<HTMLElement>, position: number) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || selectedIllustrationId;
    if (!id) return;
    updateIllustration(id, { after: position });
    setSelectedIllustrationId(id);
    setStatus(`${position === 0 ? "첫 문단 앞" : `${position}번 문단 뒤`}에 삽화를 배치했어요`);
  };

  const renderChatHeader = () => {
    if (chatSkin === "instagram") return <div className="chat-app-header instagram-header"><span>‹</span><ProfileAvatar src={profileA} name={characterA} className="header-avatar" /><div><b>{characterA}</b><small>활동 중</small></div><strong>♧　ⓘ</strong></div>;
    if (chatSkin === "kakao") return <div className="chat-app-header kakao-header"><span>‹</span><b>{showTitle && title ? title : `${characterA}, ${characterB}`}</b><strong>⌕　☰</strong></div>;
    if (chatSkin === "discord") return <div className="chat-app-header discord-header"><span>☰</span><b>#　{showTitle && title ? title : "오늘의-대화"}</b><strong>⌕　♙</strong></div>;
    return <div className="chat-app-header imessage-header"><span>‹</span><div><ProfileAvatar src={profileA} name={characterA} className="header-avatar" /><b>{characterA}　›</b></div><strong>⌾</strong></div>;
  };

  const renderContent = () => {
    if (theme === "chat") {
      let quoteIndex = 0;
      return <div className="chat-stream"><div className="chat-time">{recordDate.replace(/-/g, ". ")}</div>{blocks.map((block, index) => {
        if (autoQuote && isQuoteBlock(block)) {
          const isOther = quoteIndex++ % 2 === 0;
          const side = isOther ? (chatReversed ? "right" : "left") : (chatReversed ? "left" : "right");
          const name = isOther ? characterA : characterB;
          const profile = isOther ? profileA : profileB;
          return <div className={`chat-line ${side}`} key={`${block}-${index}`}>
            <ProfileAvatar src={profile} name={name} />
            <div className="chat-message-stack"><span className="speaker-name">{name}</span><div className="bubble">{stripQuote(block)}</div><small className="message-time">오후 9:{42 + quoteIndex}</small></div>
          </div>;
        }
        return <p className="chat-narration" key={`${block}-${index}`}>{highlightQuotes(block, autoQuote, highlightStyle)}</p>;
      })}</div>;
    }

    if (theme === "illustration") {
      return <div className="prose-body illustration-flow">
        {illustrations.length === 0 && <button className="image-placeholder illustration-empty" onClick={() => uploadRef.current?.click()}><span>＋</span><b>삽화를 여러 장 추가해 보세요</b><small>JPG, PNG, WEBP · 파일당 최대 8MB</small></button>}
        {illustrations.filter((item) => item.after === 0).map(renderIllustration)}
        {blocks.map((block, index) => <div className="illustration-paragraph" key={`${block}-${index}`}>
          <p className={autoQuote && isQuoteBlock(block) ? "quote-block" : ""}>{highlightQuotes(block, autoQuote, highlightStyle)}</p>
          {illustrations.filter((item) => item.after === index + 1).map(renderIllustration)}
        </div>)}
      </div>;
    }

    return renderProse(blocks);
  };

  const paperStyle = {
    backgroundColor: theme === "framed" ? frameColor : background,
    backgroundImage: theme === "framed" && frameImage ? `url("${frameImage}")` : undefined,
    color: foreground,
    fontFamily: selectedFont.value,
    fontSize: `${fontSize}px`,
    width: `${selectedAspect.width}px`,
    height: aspect === "auto" ? undefined : `${selectedAspect.minHeight}px`,
    minHeight: aspect === "auto" ? "0" : `${selectedAspect.minHeight}px`,
    zoom: `${zoom}%`,
    "--dynamic-accent": accent,
    "--body-line-height": lineHeight,
    "--notebook-line-height": `${lineHeight}em`,
    "--side-padding": `${sidePadding}px`,
    "--fit-scale": fitScale,
    "--content-font-size": `${fontSize}px`,
  } as CSSProperties;

  return (
    <main className="app-shell">
      <header className="titlebar">
        <div className="traffic-lights" aria-hidden="true"><span className="red" /><span className="yellow" /><span className="green" /></div>
        <div className="brand">LOGMAKER <span>/ {title || "UNTITLED"}</span></div>
        <div className="title-actions"><span className="save-status"><i />{status}</span><button className="export-button" onClick={() => void exportImage()} disabled={isExporting}><span>⇩</span>{isExporting ? "저장 중…" : "이미지로 저장"}</button></div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="section-label">THEME LIBRARY</div><h1>어떤 장면으로<br />남길까요?</h1>
          <div className="theme-list">{themes.map((item) => <button key={item.id} className={`theme-card ${theme === item.id ? "active" : ""}`} onClick={() => setTheme(item.id)}><span className="theme-index">{item.index}</span><span><b>{item.name}</b><small>{item.description}</small></span>{theme === item.id && <i>✓</i>}</button>)}</div>
          <div className="sidebar-note"><span>⌘ S</span> 선택한 비율의 PNG로 저장 · 입력 내용과 이미지는 저장하지 않으며 새로고침하면 초기화됩니다.</div>
        </aside>

        <section className="canvas-area" ref={canvasRef}>
          <div className="canvas-toolbar"><div className="zoom-control"><button aria-label="축소" onClick={() => setZoom((value) => Math.max(40, value - 10))}>−</button><span>{zoom}%</span><button aria-label="확대" onClick={() => setZoom((value) => Math.min(110, value + 10))}>＋</button></div><span className="canvas-size">{selectedAspect.name.toUpperCase()} · {selectedAspect.ratio} · {charCount.toLocaleString()}자</span></div>
          <div className="paper-stage">
            <article ref={previewRef} className={`paper-preview theme-${theme} ${aspect !== "auto" ? "fixed-page" : ""} ${theme === "chat" ? `chat-skin-${chatSkin}` : ""} ${theme === "letter" ? "notebook-paper" : ""}`} style={paperStyle}>
              {aspect !== "auto" && <div className="ratio-preview-overlay" data-preview-only="true" aria-hidden="true"><span>{selectedAspect.ratio} · 한 페이지 맞춤 {fitScale < .995 ? `${Math.round(fitScale * 100)}%` : ""}</span></div>}
              <div className="page-shell">
                {theme === "framed" ? <div className="framed-sheet" style={{ backgroundColor: background, color: foreground }}><div ref={contentRef} className="page-copy">
                  <div className="paper-meta"><span>{recordDate.replace(/-/g, ". ")}</span></div>
                  {showTitle && <h2>{title || "제목 없는 기록"}</h2>}
                  {renderContent()}
                </div></div> : <div ref={contentRef} className="page-copy">
                  {theme === "chat" ? renderChatHeader() : <div className="paper-meta"><span>{recordDate.replace(/-/g, ". ")}</span></div>}
                  {theme === "letter" && <div className="letter-to">TO. <b>{author || "당신에게"}</b></div>}
                  {theme !== "chat" && showTitle && <h2>{title || "제목 없는 기록"}</h2>}
                  {renderContent()}
                  {theme === "letter" && letterFrom.trim() && <div className="letter-sign">FROM. {letterFrom}</div>}
                </div>}
              </div>
            </article>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-tabs"><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>내용</button><button className={tab === "style" ? "active" : ""} onClick={() => setTab("style")}>스타일</button></div>
          {tab === "content" ? <>
            <label>기록 제목<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="기록의 제목" /></label>
            <button className="auto-rule title-rule" onClick={() => setShowTitle((value) => !value)} aria-pressed={showTitle}><span><b>제목 표시</b><small>{showTitle ? "이미지에 제목이 보여요" : "제목을 이미지에서 숨겼어요"}</small></span><span className={`switch ${showTitle ? "on" : ""}`}><i /></span></button>
            <label>기록 날짜<input type="date" value={recordDate} onChange={(event) => setRecordDate(event.target.value)} /></label>
            <label>대화 또는 본문<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={'문단 사이는 빈 줄로 구분해 주세요.\n“따옴표 안의 대사”는 자동으로 인식해요.'} /></label>
            <div className="text-stats"><span>{charCount.toLocaleString()}자</span><span>대사 {quoteCount}개</span><span>{blocks.length}문단</span></div>
            {theme === "chat" ? <div className="chat-settings">
              <div className="control-title"><b>메신저 디자인</b><small>대화 내용은 그대로 유지돼요</small></div>
              <div className="option-grid chat-skin-picker">{chatSkins.map((skin) => <button key={skin.id} className={chatSkin === skin.id ? "active" : ""} onClick={() => setChatSkin(skin.id)}><i>{skin.badge}</i>{skin.name}</button>)}</div>
              <div className="character-card"><ProfileAvatar src={profileA} name={characterA} /><label>상대방<input value={characterA} onChange={(event) => setCharacterA(event.target.value)} /></label><button onClick={() => profileARef.current?.click()}>사진</button></div>
              <div className="character-card"><ProfileAvatar src={profileB} name={characterB} /><label>나<input value={characterB} onChange={(event) => setCharacterB(event.target.value)} /></label><button onClick={() => profileBRef.current?.click()}>사진</button></div>
              <button className="chat-swap" onClick={() => setChatReversed((value) => !value)}><span>⇄</span><div><b>좌우 위치 바꾸기</b><small>{chatReversed ? "나 왼쪽 · 상대방 오른쪽" : "상대방 왼쪽 · 나 오른쪽"}</small></div></button>
              <input ref={profileARef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => readImage(event, setProfileA)} />
              <input ref={profileBRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => readImage(event, setProfileB)} />
            </div> : <>{<label>{theme === "letter" ? "받는 사람" : "기록 정보"}<input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder={theme === "letter" ? "편지를 받는 사람" : "등장인물 또는 기록 정보"} /></label>}{theme === "letter" && <label>보내는 사람 <small className="optional-label">선택</small><input value={letterFrom} onChange={(event) => setLetterFrom(event.target.value)} placeholder="비워두면 FROM을 표시하지 않아요" /></label>}</>}
            <button className="auto-rule" onClick={() => setAutoQuote((value) => !value)} aria-pressed={autoQuote}><span><b>따옴표 자동 인식</b><small>{theme === "chat" ? "대사를 두 캐릭터의 메시지로 바꿔요" : "“ ” 안의 문장을 찾아 강조해요"}</small></span><span className={`switch ${autoQuote ? "on" : ""}`}><i /></span></button>
            {theme === "illustration" && <div className="illustration-settings">
              <div className="upload-panel"><div><b>삽화 이미지 여러 장</b><small>한 번에 여러 파일 선택 · 파일당 최대 8MB</small></div><button onClick={() => uploadRef.current?.click()}>＋ 추가</button></div>
              {illustrations.length > 0 ? <div className="illustration-library">{illustrations.map((item, index) => <div className={`illustration-library-item ${selectedIllustrationId === item.id ? "active" : ""}`} key={item.id}>
                <button className="illustration-select" onClick={() => setSelectedIllustrationId(item.id)}><img src={item.src} alt={`삽화 ${index + 1} 미리보기`} /><span><b>삽화 {index + 1}</b><small>{item.after === 0 ? "첫 문단 앞" : `${item.after}번 문단 뒤`}</small></span></button>
                <button className="illustration-remove" aria-label={`삽화 ${index + 1} 삭제`} onClick={() => removeIllustration(item.id)}>×</button>
              </div>)}</div> : <p className="illustration-empty-note">추가한 삽화는 저장되지 않으며 새로고침하면 사라져요.</p>}
              {selectedIllustration && <div className="illustration-size-controls">
                <div className="selected-illustration-label">선택됨 · 삽화 {illustrations.findIndex((item) => item.id === selectedIllustration.id) + 1}</div>
                <label className="range-label"><span>가로 너비 <b>{selectedIllustration.width}%</b></span><input type="range" min="30" max="100" step="2" value={selectedIllustration.width} onChange={(event) => updateIllustration(selectedIllustration.id, { width: Number(event.target.value) })} /></label>
                <label className="range-label"><span>세로 높이 <b>{selectedIllustration.height}px</b></span><input type="range" min="100" max="700" step="10" value={selectedIllustration.height} onChange={(event) => updateIllustration(selectedIllustration.id, { height: Number(event.target.value) })} /></label>
                <div className="control-title illustration-focus-title"><b>보이는 위치</b><small>얼굴이나 눈에 초점을 맞춰요</small></div>
                <div className="gap-control-grid illustration-position-grid"><label className="range-label"><span>좌우 <b>{selectedIllustration.positionX}%</b></span><input type="range" min="0" max="100" step="1" value={selectedIllustration.positionX} onChange={(event) => updateIllustration(selectedIllustration.id, { positionX: Number(event.target.value) })} /></label><label className="range-label"><span>상하 <b>{selectedIllustration.positionY}%</b></span><input type="range" min="0" max="100" step="1" value={selectedIllustration.positionY} onChange={(event) => updateIllustration(selectedIllustration.id, { positionY: Number(event.target.value) })} /></label></div>
                <div className="gap-control-grid"><label className="range-label"><span>위 여백 <b>{selectedIllustration.topGap}px</b></span><input type="range" min="0" max="120" step="4" value={selectedIllustration.topGap} onChange={(event) => updateIllustration(selectedIllustration.id, { topGap: Number(event.target.value) })} /></label><label className="range-label"><span>아래 여백 <b>{selectedIllustration.bottomGap}px</b></span><input type="range" min="0" max="120" step="4" value={selectedIllustration.bottomGap} onChange={(event) => updateIllustration(selectedIllustration.id, { bottomGap: Number(event.target.value) })} /></label></div>
                <div className="control-title"><b>이미지 맞춤</b><small>선택한 삽화에만 적용돼요</small></div>
                <div className="option-grid"><button className={selectedIllustration.fit === "cover" ? "active" : ""} onClick={() => updateIllustration(selectedIllustration.id, { fit: "cover" })}>영역 채우기</button><button className={selectedIllustration.fit === "contain" ? "active" : ""} onClick={() => updateIllustration(selectedIllustration.id, { fit: "contain" })}>전체 보기</button></div>
              </div>}
              {illustrations.length > 0 && <><div className="control-title"><b>문단 사이에 배치</b><small>선택한 삽화를 누르거나 칩을 끌어 놓으세요</small></div>
              <div className="illustration-drop-list">{Array.from({ length: blocks.length + 1 }, (_, position) => <button key={position} className={selectedIllustration?.after === position ? "active" : ""} onClick={() => selectedIllustration && updateIllustration(selectedIllustration.id, { after: position })} onDragOver={(event) => event.preventDefault()} onDrop={(event) => moveIllustration(event, position)}>
                <span>{position === 0 ? "첫 문단 앞" : `${position}번 문단 뒤`}</span>
                <span className="illustration-chips">{illustrations.filter((item) => item.after === position).map((item) => <i className={selectedIllustrationId === item.id ? "selected" : ""} key={item.id} draggable onClick={(event) => { event.stopPropagation(); setSelectedIllustrationId(item.id); }} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}>⠿ {illustrations.findIndex((entry) => entry.id === item.id) + 1}</i>)}</span>
              </button>)}</div></>}
            </div>}
            {theme === "framed" && <div className="frame-settings">
              <div className="upload-panel"><div><b>배경 이미지</b><small>없으면 선택한 배경색으로 채워져요</small></div><button onClick={() => frameUploadRef.current?.click()}>{frameImage ? "교체" : "추가"}</button>{frameImage && <button className="remove-image" onClick={() => setFrameImage(null)}>삭제</button>}</div>
              <label className="frame-color-label">배경색<input type="color" value={frameColor} onChange={(event) => setFrameColor(event.target.value)} /></label>
            </div>}
            <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(event) => void readIllustrations(event)} />
            <input ref={frameUploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => readImage(event, setFrameImage)} />
            {theme === "chat" && <div className="tip"><b>대사 입력 규칙</b><p>따옴표로 감싼 문단을 위에서부터 두 캐릭터에게 번갈아 배정합니다. 서술 문단은 대화 중간 안내문으로 남아요.</p></div>}
          </> : <>
            <div className="control-title"><b>저장 이미지 비율</b><small>내용 맞춤은 글 길이만큼만 저장해요</small></div>
            <div className="aspect-grid">{(Object.entries(aspectPresets) as Array<[AspectId, typeof aspectPresets.auto]>).map(([id, preset]) => <button key={id} className={aspect === id ? "active" : ""} onClick={() => chooseAspect(id)}><i className={`ratio-icon ratio-${id}`} /><b>{preset.name}</b><small>{preset.ratio}</small></button>)}</div>
            <label>본문 글꼴<select value={fontId} onChange={(event) => setFontId(event.target.value)}>{fonts.map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select><small className="field-help">‘무료’ 표시는 Google Fonts에서 제공하는 오픈소스 한글 글꼴입니다.</small></label>
            <label className="range-label"><span>글자 크기 <b>{fontSize}px</b></span><input type="range" min="11" max="30" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><small className="field-help">내용 맞춤에서는 선택한 크기를 그대로 사용해요. 고정 비율은 내용이 넘칠 때 한 장에 맞게 함께 축소돼요.</small></label>
            <label className="range-label"><span>줄 간격 <b>{lineHeight.toFixed(2)}</b></span><input type="range" min="1.2" max="3" step="0.05" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} /></label>
            <label className="range-label"><span>좌우 여백 <b>{sidePadding}px</b></span><input type="range" min="24" max="180" step="4" value={sidePadding} onChange={(event) => setSidePadding(Number(event.target.value))} /></label>
            <div className="control-title"><b>따옴표 강조</b><small>강조를 없애거나 두께를 바꿀 수 있어요</small></div>
            <div className="option-grid highlight-picker"><button className={highlightStyle === "none" ? "active" : ""} onClick={() => setHighlightStyle("none")}>없음</button><button className={highlightStyle === "thin" ? "active" : ""} onClick={() => setHighlightStyle("thin")}>얇게</button><button className={highlightStyle === "thick" ? "active" : ""} onClick={() => setHighlightStyle("thick")}>두껍게</button><button className={highlightStyle === "solid" ? "active" : ""} onClick={() => setHighlightStyle("solid")}>채우기</button><button className={highlightStyle === "underline" ? "active" : ""} onClick={() => setHighlightStyle("underline")}>밑줄</button></div>
            <div className="color-grid"><label>종이 색<input type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label><label>글자 색<input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} /></label><label>강조 색<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /></label></div>
            <div className="palette-grid">{palettes.map((palette) => <button key={palette.name} onClick={() => { setBackground(palette.bg); setForeground(palette.fg); setAccent(palette.accent); }}><i style={{ background: `linear-gradient(135deg, ${palette.bg} 0 62%, ${palette.accent} 62%)` }} /><span>{palette.name}</span></button>)}</div>
            <div className="style-note"><span>✦</span><p>색상 선택기를 누르면 팔레트에 없는 어떤 색이든 직접 지정할 수 있어요.</p></div>
          </>}
        </aside>
      </div>
    </main>
  );
}

