import { Upload } from 'lucide-react';

interface FileUploaderProps {
    title: string;
    recommendation: string;
    fileTypes: string;
}

export default function FileUploader({ title, recommendation, fileTypes }: FileUploaderProps) {
    return (
        <div className="space-y-[4px]">
            <h4 className="text-base text-dark">{title}</h4>
            <p className="text-sm text-gray max-w-[368px]">{recommendation}</p>
            <div className="border-2 border-gray-200 rounded-lg p-8 text-center cursor-pointer">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-[54px] h-[54px] rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Upload className="text-primary" />
                    </div>
                    <p className="text-base text-dark font-semibold">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray">{fileTypes}</p>
                </div>
            </div>
        </div>
    );
}
