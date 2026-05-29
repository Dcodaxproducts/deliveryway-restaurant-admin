import { Type } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TypographySection = () => {
    return (
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <Type className="text-gray-500" />
                <h3 className="text-[20px] font-semibold text-dark">Typography</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="headingFont" className="block text-base font-semibold text-dark mb-2">Heading Font Family</label>
                    <Input id="headingFont" placeholder="Enter font family" className="h-[52px] border-gray-200 rounded-[12px] focus:ring-primary" />
                </div>
                <div>
                    <label htmlFor="bodyFont" className="block text-base font-semibold text-dark mb-2">Body Font Family</label>
                    <Input id="bodyFont" placeholder="Enter font family" className="h-[52px] border-gray-200 rounded-[12px] focus:ring-primary" />
                </div>
            </div>
        </div>
    );
};

export default TypographySection;
