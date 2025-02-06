import '@testing-library/jest-dom';
import { TextDecoderStream } from 'stream/web';
global.TextDecoderStream = TextDecoderStream as any;