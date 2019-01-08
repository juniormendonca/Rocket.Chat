import { Meteor } from 'meteor/meteor';
import { Importers } from 'meteor/rocketchat:importer';
import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { t } from 'meteor/rocketchat:utils';
import toastr from 'toastr';
import { ReactiveVar } from 'meteor/reactive-var';
import { ProgressStep } from '../../lib/ImporterProgressStep';

Template.adminImportHistory.helpers({
	isAdmin() {
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin');
	},
	importers() {
		return Importers.getAll();
	},
	isPreparing() {
		return Template.instance().preparing.get();
	},
	history() {
		return Template.instance().history.get();
	},
	statusMessage() {
		const statusKey = this.status || ProgressStep.NEW;

		switch (statusKey) {
			case ProgressStep.NEW:
				return t('Not_started');
			case ProgressStep.UPLOADING:
				return t('Uploading_file');
			case ProgressStep.DOWNLOADING_FILE_URL:
				return t('Downloading_file_from_external_URL');
			case ProgressStep.DOWNLOAD_COMPLETE:
				return t('Successfully_downloaded_file_from_external_URL_should_start_preparing_soon');
			case ProgressStep.PREPARING_STARTED:
				return t('Preparing_data_for_import_process');
			case ProgressStep.PREPARING_USERS:
				return t('Preparing_list_of_users');
			case ProgressStep.PREPARING_CHANNELS:
				return t('Preparing_list_of_channels');
			case ProgressStep.PREPARING_MESSAGES:
				return t('Preparing_list_of_messages');
			case ProgressStep.USER_SELECTION:
				return t('Selecting_users');
			case ProgressStep.IMPORTING_STARTED:
				return t('Started');
			case ProgressStep.IMPORTING_USERS:
				return t('Importing_users');
			case ProgressStep.IMPORTING_CHANNELS:
				return t('Importing_channels');
			case ProgressStep.IMPORTING_MESSAGES:
				return t('Importing_messages');
			case ProgressStep.FINISHING:
				return t('Almost_done');
			case ProgressStep.DONE:
				return t('Completed');
			case ProgressStep.ERROR:
				return t('Error');
			case ProgressStep.CANCELLED:
				return t('Canceled');
			default:
				return statusKey;
		}
	},

	lastUpdated() {
		if (!this._updatedAt) {
			return '';
		}

		const date = new Date(this._updatedAt);
		return date.toLocaleString();
	},

	hasCounters() {
		return Boolean(this.count);
	},

	userCount() {
		if (this.count && this.count.users) {
			return this.count.users;
		}

		return 0;
	},

	channelCount() {
		if (this.count && this.count.channels) {
			return this.count.channels;
		}

		return 0;
	},

	messageCount() {
		if (this.count && this.count.messages) {
			return this.count.messages;
		}

		return 0;
	},

	totalCount() {
		if (this.count && this.count.total) {
			return this.count.total;
		}

		return 0;
	},

	hasErrors() {
		if (!this.fileData) {
			return false;
		}

		if (this.fileData.users) {
			for (const user of this.fileData.users) {
				if (user.is_email_taken) {
					return true;
				}
				if (user.error) {
					return true;
				}
			}
		}

		return false;
	},

	formatedError() {
		if (!this.error) {
			return '';
		}

		if (typeof this.error === 'string') {
			return this.error;
		}

		return this.error.toString();
	},
});

Template.adminImportHistory.events({

});


Template.adminImportHistory.onCreated(function() {
	const instance = this;
	this.preparing = new ReactiveVar(true);
	this.history = new ReactiveVar([]);

	RocketChat.API.get('v1/getLatestImportOperations').then((data) => {
		instance.history.set(data);
		instance.preparing.set(false);
	}).catch((error) => {
		if (error) {
			toastr.error(t('Failed_To_Load_Import_Data'));
			instance.preparing.set(false);
		}
	});
});