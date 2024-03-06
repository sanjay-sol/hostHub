"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import { Fira_Code } from "next/font/google";
import axios from "axios";

const socket = io("https://hosthub-ws.onrender.com");

const firaCode = Fira_Code({ subsets: ["latin"] });

export default function Home() {
  const [repoURL, setURL] = useState<string>("");

  const [logs, setLogs] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [projectId, setProjectId] = useState<string | undefined>();
  const [slug, setSlug] = useState<string | undefined>();
  const [deployPreviewURL, setDeployPreviewURL] = useState<
    string | undefined
  >();

  const logContainerRef = useRef<HTMLElement>(null);

  const isValidURL: [boolean, string | null] = useMemo(() => {
    if (!repoURL || repoURL.trim() === "") return [false, null];
    const regex = new RegExp(
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/
    );
    return [regex.test(repoURL), "Enter valid Github Repository URL"];
  }, [repoURL]);

  const handleClickDeploy = useCallback(async () => {
    setLoading(true);

    const { data } = await axios.post(
      `https://hosthub-3.onrender.com/project`,
      {
        gitURL: repoURL,
        slug: slug,
      }
    );

    if (data && data.data) {
      const { projectSlug, url } = data.data;
      setDeployPreviewURL(url);

      console.log(`Subscribing to logs:${projectSlug}`);
      socket.emit("subscribe", `logs:${projectSlug}`);
    }
  }, [slug, repoURL]);

  const handleSocketIncommingMessage = useCallback((message: string) => {
    try {
      console.log(`[Incomming Socket Message]:`, typeof message, message);
      const { log } = JSON.parse(message);
      console.log("MEssage########----------", message);
      console.log("logg----------", log);
      if (log || message) {
        setLogs((prev) => [...prev, message]);
        logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error parsing socket message:", error);
    }
  }, []);

  useEffect(() => {
    socket.on("message", handleSocketIncommingMessage);

    return () => {
      socket.off("message", handleSocketIncommingMessage);
    };
  }, [handleSocketIncommingMessage]);

  return (
    <main className="flex justify-center items-center h-[100vh]">
      <div className="w-[600px]">
        <span className="flex flex-col justify-start gap-2">
          <Github className="text-5xl" />
          <Input
            disabled={loading}
            value={repoURL}
            onChange={(e) => setURL(e.target.value)}
            type="url"
            placeholder="Github URL"
          />
          {/* <p className="text-sm text-neutral-300">Slug</p> */}
          <Input
            disabled={loading}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            type="text"
            placeholder="Slug (Optional)"
          />
        </span>
        <Button
          onClick={handleClickDeploy}
          disabled={!isValidURL[0] || loading}
          className="w-full mt-3"
        >
          {loading ? "In Progress" : "Deploy"}
        </Button>
        <div className="mt-2 bg-slate-900 py-4 px-2 rounded-lg">
          <p>
            Preview URL :
            <a
              target="_blank"
              className="text-sky-400 bg-sky-950 px-3 py-2 rounded-lg"
              href={deployPreviewURL}
            >
              {deployPreviewURL}
            </a>
          </p>
        </div>
        <h1 className="text-2xl text-green-500 mt-5">Build Logs</h1>
        <div
          className={`${firaCode.className} text-sm text-green-500 logs-container mt-5 border-green-500 border-2 rounded-lg p-4 h-[300px] overflow-y-auto`}
        >
          <pre className="flex flex-col gap-1">
            {logs.map((log, i) => (
              <code
                ref={logs.length - 1 === i ? logContainerRef : undefined}
                key={i}
              >{`> ${log}`}</code>
            ))}
          </pre>
        </div>
      </div>
    </main>
  );
}
