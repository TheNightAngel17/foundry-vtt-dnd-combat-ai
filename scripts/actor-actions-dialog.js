/**
 * Actor Actions Dialog - UI for managing LLM-generated action descriptions
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

export class ActorActionsDialog extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
) {
    constructor(actor, actorLlmActions, llmConnector, options = {}) {
        super(options);
        this.actor = actor;
        this.actorLlmActions = actorLlmActions;
        this.llmConnector = llmConnector;
        this.actions = [];
        this.hasChanges = false;
    }

    static DEFAULT_OPTIONS = {
        id: 'actor-actions-dialog',
        classes: ['combat-ai', 'actor-actions-dialog'],
        tag: 'form',
        window: {
            title: 'Manage AI Action Descriptions',
            resizable: true
        },
        position: {
            width: 700,
            height: 768
        },
        form: {
            closeOnSubmit: false,
            submitOnChange: false
        },
        actions: {
            addAction: ActorActionsDialog.prototype._onAddAction,
            deleteAction: ActorActionsDialog.prototype._onDeleteAction,
            generateAI: ActorActionsDialog.prototype._onGenerateAI,
            save: ActorActionsDialog.prototype._onSave
        }
    };

    static PARTS = {
        form: {
            template: 'modules/dnd-combat-ai/templates/actor-actions-dialog.hbs'
        }
    };

    async _prepareContext(options) {
        // Load current actions from actor flags
        this.actions = await this.actorLlmActions.getActorActions(this.actor, this.llmConnector);

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

    async _onAddAction(event, target) {
        event.preventDefault();
        
        // Add a new empty action
        this.actions.push({
            name: 'New Action',
            description: '',
            activationTime: 'action',
            itemType: 'feat'
        });

        this.hasChanges = true;
        await this.render();
    }

    async _onDeleteAction(event, target) {
        event.preventDefault();
        
        const index = parseInt(target.dataset.index);
        if (index >= 0 && index < this.actions.length) {
            const confirm = await foundry.applications.api.DialogV2.confirm({
                window: { title: 'Delete Action' },
                content: `<p>Are you sure you want to delete "${this.actions[index].name}"?</p>`,
                rejectClose: false,
                modal: true
            });

            if (confirm) {
                this.actions.splice(index, 1);
                this.hasChanges = true;
                await this.render();
            }
        }
    }

    async _onGenerateAI(event, target) {
        event.preventDefault();

        const confirm = await foundry.applications.api.DialogV2.confirm({
            window: { title: 'Generate Actions with AI' },
            content: `<p>This will replace all current actions with AI-generated descriptions.</p><p><strong>Are you sure?</strong></p>`,
            rejectClose: false,
            modal: true
        });

        if (!confirm) return;

        // Show loading state
        const button = target;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        try {
            // Clear existing cache for this actor to force regeneration
            await this.actorLlmActions.clearCache(this.actor.id);

            // Generate new actions
            const newActions = await this.actorLlmActions.getActorActions(this.actor, this.llmConnector);
            
            this.actions = newActions;
            this.hasChanges = true;
            
            if (game.user.isGM) {
                ui.notifications.info(`${MODULE_TITLE} | Generated ${newActions.length} actions for ${this.actor.name}`);
            }
            
            await this.render();
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error generating actions:`, error);
            if (game.user.isGM) {
                ui.notifications.error(`${MODULE_TITLE} | Failed to generate actions. Check console for details.`);
            }
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-magic"></i> Generate with AI';
        }
    }

    async _onSave(event, target) {
        event.preventDefault();

        // Gather form data
        const formElement = this.element.querySelector('form');
        const formData = new FormData(formElement);
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
            
            if (game.user.isGM) {
                ui.notifications.info(`${MODULE_TITLE} | Saved ${updatedActions.length} actions for ${this.actor.name}`);
            }
            
            // Refresh the dialog to show updated timestamp
            await this.render();
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error saving actions:`, error);
            if (game.user.isGM) {
                ui.notifications.error(`${MODULE_TITLE} | Failed to save actions. Check console for details.`);
            }
        }
    }

    async _onSubmitForm(event, form, formData) {
        // This is called by the form handler on submit
        // We handle saving in _onSave instead
    }

    async _onClose(options) {
        if (this.hasChanges) {
            const confirm = await foundry.applications.api.DialogV2.confirm({
                window: { title: 'Unsaved Changes' },
                content: '<p>You have unsaved changes. Are you sure you want to close?</p>',
                rejectClose: false,
                modal: true
            });

            if (!confirm) {
                return false; // Prevent closing
            }
        }

        return super._onClose(options);
    }
}
