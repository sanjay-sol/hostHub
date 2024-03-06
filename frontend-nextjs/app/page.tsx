import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import axios from "axios";

const Home = () => {
  const [repoURL, setURL] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string>();
  const [deployPreviewURL, setDeployPreviewURL] = useState<string>();

  const logContainerRef = useRef<HTMLElement>(null);

  const socket = useMemo(() => io(`${process.env.NEXT_PUBLIC_SOCKET_URL}`), []);

  const isValidURL = useMemo(() => {
    if (!repoURL || repoURL.trim() === "") return [false, null];
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/;
    return [regex.test(repoURL), "Enter valid Github Repository URL"];
  }, [repoURL]);

  const handleClickDeploy = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await axios.post(`${process.env.API_URL}/project`, {
        gitURL: repoURL,
        slug,
      });

      if (data?.data) {
        const { projectSlug, url } = data.data;
        setDeployPreviewURL(url);
        socket.emit("subscribe", `logs:${projectSlug}`);
      }
    } catch (error) {
      console.error("Error deploying project:", error);
    } finally {
      setLoading(false);
    }
  }, [repoURL, slug, socket]);

  const handleSocketIncomingMessage = useCallback((message: string) => {
    try {
      console.log(`[Incoming Socket Message]:`, typeof message, message);
      const { log } = JSON.parse(message);
      setLogs((prevLogs) => [...prevLogs, log || message]);
      logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error parsing socket message:", error);
    }
  }, []);

  useEffect(() => {
    socket.on("message", handleSocketIncomingMessage);

    return () => {
      socket.off("message", handleSocketIncomingMessage);
    };
  }, [socket, handleSocketIncomingMessage]);

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
        {deployPreviewURL && (
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
        )}
        <h1 className="text-2xl text-green-500 mt-5">Build Logs</h1>
        <div className="text-sm text-green-500 logs-container mt-5 border-green-500 border-2 rounded-lg p-4 h-[300px] overflow-y-auto">
          <pre>
            {logs.map((log, i) => (
              <code
                key={i}
                ref={i === logs.length - 1 ? logContainerRef : undefined}
              >{`> ${log}`}</code>
            ))}
          </pre>
        </div>
      </div>
    </main>
  );
};

export default Home;
