export type TutorContext = { learnerId: string; exam?: string; subject?: string; topic?: string };
export type ResolvedQuestion = { kind: "exact" | "related" | "generated"; questionId?: string; content: string; provenance?: string };
export interface AIProvider { explain(input: { prompt: string; context: TutorContext }): Promise<AsyncIterable<string>> }
export interface QuestionResolver { resolve(query: string, context?: TutorContext): Promise<ResolvedQuestion | null> }
export interface EducationalRetriever { retrieve(query: string, context?: TutorContext): Promise<ResolvedQuestion[]> }
export interface VisionSolver { solve(objectKey: string, context?: TutorContext): Promise<AsyncIterable<string>> }
export interface ExplanationGenerator { explain(question: ResolvedQuestion, context?: TutorContext): Promise<AsyncIterable<string>> }
export interface TutorContextBuilder { build(learnerId: string): Promise<TutorContext> }
