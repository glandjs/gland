import { expect } from 'chai';
import sinon from 'sinon';
import * as fs from 'fs';
import path from 'path';
import { LoadModules } from '../../../lib/helper/load';

describe('LoadModules', () => {
  let readFileStub: sinon.SinonStub;
  let readdirStub: sinon.SinonStub;
  let statStub: sinon.SinonStub;
  let importStub: sinon.SinonStub;

  beforeEach(() => {
    readFileStub = sinon.stub(fs.promises, 'readFile');
    readdirStub = sinon.stub(fs.promises, 'readdir');
    statStub = sinon.stub(fs.promises, 'stat');
    importStub = sinon.stub(LoadModules, 'importModule');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('parseConfig', () => {
    it('should parse configuration file and return the correct config object', async () => {
      const mockConfig = `
        path=./modules
        recursive=true
        pattern=*.ts
        cacheModules=true
        logLevel=info
      `;

      readFileStub.resolves(mockConfig);

      const result = await LoadModules['parseConfig']('./mock-config.conf');
      expect(result).to.deep.equal({
        path: './modules',
        recursive: true,
        pattern: '*.ts',
        cacheModules: true,
        logLevel: 'info',
      });
    });

    it('should cache the config after reading', async () => {
      const mockConfig = `path=mockDir`;

      readFileStub.resolves(mockConfig);
      const result1 = await LoadModules['parseConfig']('./mock-config.conf');
      const result2 = await LoadModules['parseConfig']('./mock-config.conf');
      expect(result2).to.deep.equal(result1);
    });
  });

  describe('findModules', () => {
    it('should return a list of files matching the pattern', async () => {
      const mockFiles = ['file1.ts', 'file2.ts'];
      const mockStat = {
        isDirectory: () => false,
        isFile: () => true,
      };

      readdirStub.resolves(mockFiles);
      statStub.resolves(mockStat);

      const result = await LoadModules['findModules']('./modules', '*.ts', true);
      expect(result).to.deep.equal(['modules/file1.ts', 'modules/file2.ts']);
    });

    it('should recursively find files in subdirectories if recursive is true', async () => {
      const mockFiles = ['subdir', 'file1.ts'];
      const mockStatDir = {
        isDirectory: () => true,
        isFile: () => false,
      };
      const mockStatFile = {
        isDirectory: () => false,
        isFile: () => true,
      };

      readdirStub.onFirstCall().resolves(mockFiles);
      readdirStub.onSecondCall().resolves(['file2.ts']);
      statStub.onFirstCall().resolves(mockStatDir);
      statStub.onSecondCall().resolves(mockStatFile);
      statStub.onThirdCall().resolves(mockStatFile);

      const result = await LoadModules['findModules']('./modules', '*.ts', true);
      expect(result).to.deep.equal(['modules/file1.ts', 'modules/subdir/file2.ts']);
    });
  });

  describe('load', () => {
    it('should load all modules and return them in the module cache', async () => {
      const mockConfig = `
        path=./modules
        recursive=true
        pattern=*.ts
        cacheModules=true
        logLevel=info
      `;

      readFileStub.resolves(mockConfig);
      readdirStub.resolves(['file1.ts', 'file2.ts']);
      statStub.resolves({ isDirectory: () => false, isFile: () => true });

      // Mock the dynamic imports
      importStub.withArgs(path.resolve('/home/mahdi/Projects/PACKAGE/gland/modules/file1.ts')).resolves({ module1: 'mockModule1' });
      importStub.withArgs(path.resolve('/home/mahdi/Projects/PACKAGE/gland/modules/file2.ts')).resolves({ module2: 'mockModule2' });

      const modules = await LoadModules.load(path.join(__dirname, '.confmodule'));

      expect(modules).to.have.keys('file1', 'file2');
      expect(modules['file1']).to.deep.equal({ module1: 'This is module 1' });
      expect(modules['file2']).to.deep.equal({ module2: 'This is module 2' });
    });
  });
});
