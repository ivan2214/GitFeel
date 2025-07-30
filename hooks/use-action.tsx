"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export interface ActionResult {
	errorMessage?: string;
	successMessage?: string;
}

interface ActionOptions<TState extends ActionResult> {
	onSuccess?: (state: TState) => void;
	onError?: (state: TState) => void;
	redirectTo?: string;
	showToasts?: boolean;
}

export function useAction<TInput, TState extends ActionResult>(
	action: (prevState: TState, input: TInput) => Promise<TState>,
	initialState: Awaited<TState>,
	options: ActionOptions<TState> = {},
) {
	const router = useRouter();

	const [state, execute, pending] = useActionState<TState, TInput>(action, initialState);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (options.showToasts !== false) {
			if (state.errorMessage) toast.error(state.errorMessage);
			if (state.successMessage) toast.success(state.successMessage);
		}

		if (state.successMessage && options.redirectTo) {
			router.push(options.redirectTo);
		}

		if (state.successMessage && options.onSuccess) {
			options.onSuccess(state);
		}

		if (state.errorMessage && options.onError) {
			options.onError(state);
		}
	}, [state]);

	return { state, execute, pending };
}
