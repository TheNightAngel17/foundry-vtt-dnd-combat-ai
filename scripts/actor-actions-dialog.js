/**
 * Actor Actions Dialog - UI for managing LLM-generated action descriptions
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

export class ActorActionsDialog extends FormApplication {
    constructor(actor, actorLlmActions, llmConnector, options = {}) {
        super({}, options);
        this.actor = actor;
        this.actorLlmActions = actorLlmActions;
        this.llmConnector = llmConnector;
        this.actions = [];
        this.hasChanges = false;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'actor-actions-dialog',
            classes: ['combat-ai', 'actor-actions-dialog'],
            title: 'Manage AI Action Descriptions',
            template: 'modules/dnd-combat-ai/templates/actor-actions-dialog.hbs',
            width: 700,
            height: 600,
            resizable: true,
            closeOnSubmit: false,
            submitOnClose: false,
            tabs: []
        });
    }

    async getData() {
        // Load current actions from actor flags
        // const flagData = this.actor.getFlag(MODULE_ID, 'cachedActions');
        this.actions = await this.actorLlmActions.getActorActions(this.actor, this.llmConnector)

        console.log(`${MODULE_TITLE} | Loaded ${this.actions.length} actions for ${this.actor.name} in dialog`, this.actions);

        return {
            actor: this.actor,
            actions: this.actions,
            hasActions: this.actions.length > 0,
            timestamp: 'Never',
            activationTypes: [
                { value: 'action', label: 'Action' },
                { value: 'bonus', label: 'Bonus Action' },
                { value: 'reaction', label: 'Reaction' },
                { value: 'legendary', label: 'Legendary Action' },
                { value: 'lair', label: 'Lair Action' },
                { value: 'mythic', label: 'Mythic Action' },
                { value: 'special', label: 'Special' }
            ],
            itemTypes: [
                { value: 'weapon', label: 'Weapon' },
                { value: 'spell', label: 'Spell' },
                { value: 'feat', label: 'Feat' }
            ]
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add new action
        html.find('.add-action').click(this._onAddAction.bind(this));

        // Delete action
        html.find('.delete-action').click(this._onDeleteAction.bind(this));

        // Generate with AI
        html.find('.generate-ai').click(this._onGenerateAI.bind(this));

        // Save changes
        html.find('.save-actions').click(this._onSave.bind(this));

        // Track changes
        html.find('input, textarea, select').change(() => {
            this.hasChanges = true;
            html.find('.save-actions').prop('disabled', false);
        });
    }

    async _onAddAction(event) {
        event.preventDefault();
        
        // Add a new empty action
        this.actions.push({
            name: 'New Action',
            description: '',
            activationTime: 'action',
            itemType: 'feat'
        });

        this.hasChanges = true;
        await this.render(false);
    }

    async _onDeleteAction(event) {
        event.preventDefault();
        
        const index = parseInt(event.currentTarget.dataset.index);
        if (index >= 0 && index < this.actions.length) {
            const confirm = await Dialog.confirm({
                title: 'Delete Action',
                content: `<p>Are you sure you want to delete "${this.actions[index].name}"?</p>`,
                yes: () => true,
                no: () => false
            });

            if (confirm) {
                this.actions.splice(index, 1);
                this.hasChanges = true;
                await this.render(false);
            }
        }
    }

    async _onGenerateAI(event) {
        event.preventDefault();

        const confirm = await Dialog.confirm({
            title: 'Generate Actions with AI',
            content: `<p>This will replace all current actions with AI-generated descriptions.</p><p><strong>Are you sure?</strong></p>`,
            yes: () => true,
            no: () => false
        });

        if (!confirm) return;

        // Show loading state
        const button = $(event.currentTarget);
        button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Generating...');

        try {
            // Clear existing cache for this actor to force regeneration
            await this.actorLlmActions.clearCache(this.actor.id);

            // Generate new actions
            const newActions = await this.actorLlmActions.getActorActions(this.actor, this.llmConnector);
            
            this.actions = newActions;
            this.hasChanges = true;
            
            ui.notifications.info(`${MODULE_TITLE} | Generated ${newActions.length} actions for ${this.actor.name}`);
            
            await this.render(false);
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error generating actions:`, error);
            ui.notifications.error(`${MODULE_TITLE} | Failed to generate actions. Check console for details.`);
        } finally {
            button.prop('disabled', false).html('<i class="fas fa-magic"></i> Generate with AI');
        }
    }

    async _onSave(event) {
        event.preventDefault();

        // Gather form data
        const formData = new FormData(this.element.find('form')[0]);
        const updatedActions = [];

        // Parse form data into actions array
        let index = 0;
        while (formData.has(`action-${index}-name`)) {
            const action = {
                name: formData.get(`action-${index}-name`),
                description: formData.get(`action-${index}-description`),
                activationTime: formData.get(`action-${index}-activationTime`),
                itemType: formData.get(`action-${index}-itemType`)
            };
            updatedActions.push(action);
            index++;
        }

        // Save to actor flags
        try {
            await this.actorLlmActions.saveActorActions(this.actor, updatedActions);
            
            this.actions = updatedActions;
            this.hasChanges = false;
            
            ui.notifications.info(`${MODULE_TITLE} | Saved ${updatedActions.length} actions for ${this.actor.name}`);
            
            // Refresh the dialog to show updated timestamp
            await this.render(false);
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error saving actions:`, error);
            ui.notifications.error(`${MODULE_TITLE} | Failed to save actions. Check console for details.`);
        }
    }

    async _updateObject(event, formData) {
        // This is called by FormApplication on submit, but we handle it in _onSave instead
    }

    async close(options = {}) {
        if (this.hasChanges && !options.force) {
            const confirm = await Dialog.confirm({
                title: 'Unsaved Changes',
                content: '<p>You have unsaved changes. Are you sure you want to close?</p>',
                yes: () => true,
                no: () => false
            });

            if (!confirm) return;
        }

        return super.close(options);
    }
}
