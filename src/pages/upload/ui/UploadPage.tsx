import { ShowcaseUploadWorkbench } from "@/features/submit-showcase/ui/ShowcaseUploadWorkbench";
import type { PageContract } from "@/shared/contracts/page";
import { StageMeta } from "@/widgets/app-shell/ui/StageMeta";

type UploadPageProps = {
  page: PageContract;
};

export function UploadPage({ page }: UploadPageProps) {
  return (
    <section className="upload-stage" aria-label="MuseHub upload workspace">
      <StageMeta page={page} />
      <div className="upload-hero">
        <div className="upload-hero-copy">
          <p className="upload-eyebrow">/upload</p>
          <h1>Upload Community Assets</h1>
          <p>
            两种入口：让 Agent 读取 <code>/upload/skill.md</code> 自动准备 PR，或在前端生成手动 PR
            package。所有内容最终通过 git 提交进入仓库。
          </p>
        </div>
        <div className="upload-hero-card" aria-hidden="true">
          <span>Skill</span>
          <i />
          <strong>Schema</strong>
          <i />
          <span>Validate</span>
          <b>PR</b>
        </div>
      </div>
      <ShowcaseUploadWorkbench />
    </section>
  );
}
