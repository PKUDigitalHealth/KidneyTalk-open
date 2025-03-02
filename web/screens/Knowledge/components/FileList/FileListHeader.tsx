import React, { useEffect, useState } from 'react';
import { Button, Tooltip } from '@janhq/joi';
import { Settings, Upload } from 'lucide-react';
import { LEFT_PANEL_WIDTH } from '@/containers/LeftPanelContainer';

interface FileListHeaderProps {
    onUpload: () => void;
    onOpenAgentInstruction: () => void;
    isLoading?: boolean;
}

export const FileListHeader: React.FC<FileListHeaderProps> = ({
    onUpload,
    onOpenAgentInstruction,
    isLoading
}) => {
    const [showIcons, setShowIcons] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const leftPanelWidth = Number(localStorage.getItem(LEFT_PANEL_WIDTH)) || 200;
            setShowIcons(leftPanelWidth < 400);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        const intervalId = setInterval(handleResize, 100);
        const handleMouseMove = () => {
            requestAnimationFrame(handleResize);
        };
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className='relative flex items-center w-full p-2'>
            <h2 className="font-medium truncate mr-2">{showIcons ? 'Docs' : 'Knowledge Documents'}</h2>
            <div className="flex-1 right-2 flex items-center gap-1">
                <Tooltip
                    trigger={
                        <Button
                            onClick={onOpenAgentInstruction}
                            variant="soft"
                            className="flex items-center justify-center"
                            size="small"
                        >
                            {showIcons ? (
                                <Settings className="w-4 h-4" />
                            ) : (
                                <span className="px-1">Agent Settings</span>
                            )}
                        </Button>
                    }
                    content="Set the prompt template for text processing"
                    side="bottom"
                />
                <Tooltip
                    trigger={
                        <Button
                            onClick={onUpload}
                            disabled={isLoading}
                            className="flex items-center justify-center"
                            size="small"
                            variant='solid'
                        >
                            {showIcons ? (
                                <Upload className="w-4 h-4 text-blue" />
                            ) : (
                                <span className="px-1">Upload</span>
                            )}
                        </Button>
                    }
                    content="Upload multiple documents at once, supports PDF and Markdown formats"
                    side="bottom"
                />
            </div>
        </div>
    );
}; 