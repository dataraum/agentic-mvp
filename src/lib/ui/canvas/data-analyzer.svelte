<script>
	import { SvelteFlow, Background, Controls, MiniMap, ControlButton } from '@xyflow/svelte';
	import Dagre from '@dagrejs/dagre';
	import DataFile from '$lib/ui/canvas/table-node/data-file.svelte';
	import Query from '$lib/ui/canvas/query-node/query.svelte';
	import { resetGraph, getNodes, setNodes, getEdges, setEdges } from '$lib/ui/canvas/index.svelte';
	import '@xyflow/svelte/dist/style.css';
	import ErrorView from '../view/error-view.svelte';
	import { deleteItAll } from '$lib/persist/surreal';
	import { updatePosition } from '$lib/persist/surreal';
	import ButtonDials from './button-dials.svelte';
	import Chart from './chart-node/chart.svelte';

	/** @type {import('@xyflow/svelte').NodeTypes} */
	const nodeTypes = {
		dataNode: DataFile,
		queryNode: Query,
		chartNode: Chart
	};

	let zoomOnScroll = true;

	function doLayout() {
		const dagreGraph = new Dagre.graphlib.Graph();
		dagreGraph.setDefaultEdgeLabel(() => ({}));
		dagreGraph.setGraph({ rankdir: 'TB' });

		let nodes = getNodes();
		const edges = getEdges();
		nodes.forEach((node) => {
			dagreGraph.setNode(node.id, {
				...node,
				width: node.measured?.width ?? 0,
				height: node.measured?.height ?? 0
			});
		});

		edges.forEach((edge) => {
			dagreGraph.setEdge(edge.source, edge.target);
		});

		Dagre.layout(dagreGraph);

		nodes = nodes.map((node) => {
			const position = dagreGraph.node(node.id);
			// We are shifting the dagre node position (anchor=center center) to the top left
			// so it matches the Svelte Flow node anchor point (top left).
			const x = position.x - (node.measured?.width ?? 0) / 2 + 50;
			const y = position.y - (node.measured?.height ?? 0) / 2 + 70;

			return {
				...node,
				position: { x, y }
			};
		});

		storeUpdateNodesSync(nodes);

		// trigger a redraw in xyflow
		setNodes(nodes);
	}

	async function resetLocalData() {
		resetGraph();
		await deleteItAll().then(() => {
			navigator.storage
				.getDirectory()
				.then((opfsRoot) => opfsRoot.removeEntry('data', { recursive: true }))
				.then(() => window.location.reload());
		});
	}

	/**
	 * @param {import("@xyflow/svelte").Node[]} nodes
	 */
	async function storeUpdateNodesSync(nodes) {
		for (const node of nodes) {
			await storeNodePosition(node);
		}
	}

	/**
	 * @param {import("@xyflow/svelte").Node} node
	 */
	async function storeNodePosition(node) {
		switch (node.type) {
			case 'queryNode':
				await updatePosition('queries', node.position, node.id);
				break;
			case 'dataNode':
				await updatePosition('data', node.position, node.id);
				break;
			case 'chartNode':
				await updatePosition('charts', node.position, node.id);
				break;
		}
	}

	/**
	 * @param {{ targetNode: any; nodes?: import("@xyflow/svelte").Node[]; event?: MouseEvent | TouchEvent; }} e
	 */
	async function persistNodePositionAfterDrag(e) {
		storeNodePosition(e.targetNode);
	}
</script>

<div class="overview h-full" style="height: 100vh;">
	<SvelteFlow
		bind:nodes={getNodes, setNodes}
		bind:edges={getEdges, setEdges}
		{nodeTypes}
		{zoomOnScroll}
		preventScrolling={false}
		onnodedragstop={(e) => persistNodePositionAfterDrag(e)}
		onnodepointerenter={() => (zoomOnScroll = false)}
		onnodepointerleave={() => (zoomOnScroll = true)}
	>
		<ButtonDials />
		<ErrorView />
		<Background />
		<Controls>
			<ControlButton title="shuffle layout" onclick={() => doLayout()}>
				<span class="icon-[ph--arrows-in]"></span>
			</ControlButton>
			<ControlButton title="reset everything" onclick={() => resetLocalData()}>
				<span class="icon-[ph--trash-fill]"></span>
			</ControlButton>
			<!--ControlButton title="logout" onclick={() => (location.pathname = '/logout')}>
				<CloseCircleSolid />
			</ControlButton-->
		</Controls>
		<MiniMap zoomable pannable height={120} />
	</SvelteFlow>
</div>
