import { ProjectDoc } from '../types/types';
import { Textarea } from './ui/textarea';
import { Pencil } from 'lucide-react';

interface DocumentInputProps {
  doc: ProjectDoc | null;
  docContent: string;
  setDocContent: React.Dispatch<React.SetStateAction<string>>;
  handleDocSave: () => Promise<void>;
}

const DocumentInput: React.FC<DocumentInputProps> = ({ doc, docContent, setDocContent, handleDocSave }) => {
  return (
    <div className="flex max-w-[480px] flex-wrap items-end gap-4">
      <label className="flex flex-col min-w-40 flex-1">
        <div className="flex w-full flex-1 items-stretch rounded-xl">
          <Textarea
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-textWhite focus:outline-0 focus:ring-0 border border-border bg-darkAccent focus:border-neonTeal h-14 placeholder:text-textSecondary p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
            value={doc ? doc.content : docContent}
            onChange={(e) => setDocContent(e.target.value)}
            placeholder="Write your project documentation..."
          />
          <div
            className="text-textSecondary flex border border-border bg-darkAccent items-center justify-center pr-[15px] rounded-r-xl border-l-0 cursor-pointer"
            onClick={handleDocSave}
          >
            <Pencil className="h-6 w-6" />
          </div>
        </div>
      </label>
    </div>
  );
};

export default DocumentInput;