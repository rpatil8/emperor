#!/usr/bin/env python
# File created on 25 Jan 2013
from __future__ import division

__author__ = "Yoshiki Vazquez Baeza"
__copyright__ = "Copyright 2013, The Emperor Project"
__credits__ = ["Yoshiki Vazquez Baeza"]
__license__ = "GPL"
__version__ = "1.6.0-dev"
__maintainer__ = "Yoshiki Vazquez Baeza"
__email__ = "yoshiki89@gmail.com"
__status__ = "Development"


from shutil import rmtree
from os.path import exists, join
from cogent.util.unit_test import TestCase, main
from qiime.util import get_qiime_temp_dir, get_tmp_filename
from emperor.util import (copy_support_files, keep_columns_from_mapping_file,
    preprocess_mapping_file)

class TopLevelTests(TestCase):

    def setUp(self):
        self.mapping_file_data = MAPPING_FILE_DATA
        self.mapping_file_headers = ['SampleID', 'BarcodeSequence',
            'LinkerPrimerSequence', 'Treatment', 'DOB', 'Description']
        self.valid_columns = ['Treatment', 'DOB']
        self.support_files_filename = get_qiime_temp_dir()

    def test_copy_support_files(self):
        """Test the support files are correctly copied to a file path"""
        copy_support_files(self.support_files_filename)
        self.assertTrue(exists(join(self.support_files_filename,
            'emperor_required_resources/')))

    def test_preprocess_mapping_file(self):
        """Check correct preprocessing of metadata is done"""

        # test it concatenates columns together correctly
        out_data, out_headers = preprocess_mapping_file(self.mapping_file_data,
            self.mapping_file_headers, ['Treatment', 'DOB', 'Treatment&&DOB'])
        self.assertEquals(out_headers, ['SampleID', 'Treatment', 'DOB',
            'Treatment&&DOB'])
        self.assertEquals(out_data, MAPPING_FILE_DATA_CAT_A)

        # test it filter columns properly
        out_data, out_headers = preprocess_mapping_file(self.mapping_file_data,
            self.mapping_file_headers, ['Treatment'])
        self.assertEquals(out_headers, ['SampleID', 'Treatment'])
        self.assertEquals(out_data, MAPPING_FILE_DATA_CAT_B)

        # check it removes columns with unique values
        out_data, out_headers = preprocess_mapping_file(self.mapping_file_data,
            self.mapping_file_headers, ['SampleID', 'BarcodeSequence',
            'LinkerPrimerSequence', 'Treatment', 'DOB', 'Description'],
            unique=True)
        self.assertEquals(out_headers, ['SampleID', 'LinkerPrimerSequence',
            'Treatment', 'DOB'])
        self.assertEquals(out_data, MAPPING_FILE_DATA_CAT_C)

        # check it removes columns where there is only one value
        out_data, out_headers = preprocess_mapping_file(self.mapping_file_data,
            self.mapping_file_headers, ['SampleID', 'BarcodeSequence',
            'LinkerPrimerSequence', 'Treatment', 'DOB', 'Description'],
            single=True)
        self.assertEquals(out_headers,['SampleID', 'BarcodeSequence',
            'Treatment', 'DOB', 'Description'])
        self.assertEquals(out_data, MAPPING_FILE_DATA_CAT_D)

        # keep only treatment concat treatment and DOB and remove all
        # categories with only one value and all with unique values for field
        out_data, out_headers = preprocess_mapping_file(self.mapping_file_data,
            self.mapping_file_headers, ['Treatment', 'Treatment&&DOB'],
            unique=True, single=True)
        self.assertEquals(out_headers, ['SampleID', 'Treatment',
            'Treatment&&DOB'])
        self.assertEquals(out_data, MAPPING_FILE_DATA_CAT_E)

    def test_keep_columns_from_mapping_file(self):
        """Check correct selection of metadata is being done"""

        # test it returns the same data
        out_data, out_headers = keep_columns_from_mapping_file(
            self.mapping_file_data, self.mapping_file_headers, [])
        self.assertEquals(out_data, [[], [], [], [], [], [], [], [], []])
        self.assertEquals(out_headers, [])

        # test it can filter a list of columns
        out_data, out_headers = keep_columns_from_mapping_file(
            self.mapping_file_data, self.mapping_file_headers, [
            'SampleID', 'LinkerPrimerSequence', 'Description'])
        self.assertEquals(out_headers, ['SampleID', 'LinkerPrimerSequence',
            'Description'])
        self.assertEquals(out_data, PRE_PROCESS_B)

        # test correct negation of filtering
        out_data, out_headers = keep_columns_from_mapping_file(
            self.mapping_file_data, self.mapping_file_headers,
            ['LinkerPrimerSequence', 'Description'], True)
        self.assertEquals(out_data, PRE_PROCESS_A)
        self.assertEquals(out_headers,  ['SampleID', 'BarcodeSequence',
            'Treatment', 'DOB'])

MAPPING_FILE_DATA = [
    ['PC.354','AGCACGAGCCTA','YATGCTGCCTCCCGTAGGAGT','Control','20061218','Control_mouse_I.D._354'],
    ['PC.355','AACTCGTCGATG','YATGCTGCCTCCCGTAGGAGT','Control','20061218','Control_mouse_I.D._355'],
    ['PC.356','ACAGACCACTCA','YATGCTGCCTCCCGTAGGAGT','Control','20061126','Control_mouse_I.D._356'],
    ['PC.481','ACCAGCGACTAG','YATGCTGCCTCCCGTAGGAGT','Control','20070314','Control_mouse_I.D._481'],
    ['PC.593','AGCAGCACTTGT','YATGCTGCCTCCCGTAGGAGT','Control','20071210','Control_mouse_I.D._593'],
    ['PC.607','AACTGTGCGTAC','YATGCTGCCTCCCGTAGGAGT','Fast','20071112','Fasting_mouse_I.D._607'],
    ['PC.634','ACAGAGTCGGCT','YATGCTGCCTCCCGTAGGAGT','Fast','20080116','Fasting_mouse_I.D._634'],
    ['PC.635','ACCGCAGAGTCA','YATGCTGCCTCCCGTAGGAGT','Fast','20080116','Fasting_mouse_I.D._635'],
    ['PC.636','ACGGTGAGTGTC','YATGCTGCCTCCCGTAGGAGT','Fast','20080116','Fasting_mouse_I.D._636']]

PRE_PROCESS_A = [
    ['PC.354','AGCACGAGCCTA', 'Control','20061218'],
    ['PC.355','AACTCGTCGATG', 'Control','20061218'],
    ['PC.356','ACAGACCACTCA', 'Control','20061126'],
    ['PC.481','ACCAGCGACTAG', 'Control','20070314'],
    ['PC.593','AGCAGCACTTGT', 'Control','20071210'],
    ['PC.607','AACTGTGCGTAC', 'Fast','20071112'],
    ['PC.634','ACAGAGTCGGCT', 'Fast','20080116'],
    ['PC.635','ACCGCAGAGTCA', 'Fast','20080116'],
    ['PC.636','ACGGTGAGTGTC', 'Fast','20080116']]

PRE_PROCESS_B = [
    ['PC.354', 'YATGCTGCCTCCCGTAGGAGT', 'Control_mouse_I.D._354'],
    ['PC.355', 'YATGCTGCCTCCCGTAGGAGT', 'Control_mouse_I.D._355'],
    ['PC.356', 'YATGCTGCCTCCCGTAGGAGT', 'Control_mouse_I.D._356'],
    ['PC.481', 'YATGCTGCCTCCCGTAGGAGT', 'Control_mouse_I.D._481'],
    ['PC.593', 'YATGCTGCCTCCCGTAGGAGT', 'Control_mouse_I.D._593'],
    ['PC.607', 'YATGCTGCCTCCCGTAGGAGT', 'Fasting_mouse_I.D._607'],
    ['PC.634', 'YATGCTGCCTCCCGTAGGAGT', 'Fasting_mouse_I.D._634'],
    ['PC.635', 'YATGCTGCCTCCCGTAGGAGT', 'Fasting_mouse_I.D._635'],
    ['PC.636', 'YATGCTGCCTCCCGTAGGAGT', 'Fasting_mouse_I.D._636']]

MAPPING_FILE_DATA_CAT_A = [
    ['PC.354', 'Control','20061218', 'Control20061218'],
    ['PC.355', 'Control','20061218', 'Control20061218'],
    ['PC.356', 'Control','20061126', 'Control20061126'],
    ['PC.481', 'Control','20070314', 'Control20070314'],
    ['PC.593', 'Control','20071210', 'Control20071210'],
    ['PC.607', 'Fast','20071112', 'Fast20071112'],
    ['PC.634', 'Fast','20080116', 'Fast20080116'],
    ['PC.635', 'Fast','20080116', 'Fast20080116'],
    ['PC.636', 'Fast','20080116', 'Fast20080116']]

MAPPING_FILE_DATA_CAT_B = [['PC.354', 'Control'], ['PC.355', 'Control'],
    ['PC.356', 'Control'], ['PC.481', 'Control'], ['PC.593', 'Control'],
    ['PC.607', 'Fast'], ['PC.634', 'Fast'], ['PC.635', 'Fast'],
    ['PC.636', 'Fast']]

MAPPING_FILE_DATA_CAT_C = [
    ['PC.354', 'YATGCTGCCTCCCGTAGGAGT', 'Control', '20061218'],
    ['PC.355', 'YATGCTGCCTCCCGTAGGAGT', 'Control', '20061218'],
    ['PC.356', 'YATGCTGCCTCCCGTAGGAGT', 'Control', '20061126'],
    ['PC.481', 'YATGCTGCCTCCCGTAGGAGT', 'Control', '20070314'],
    ['PC.593', 'YATGCTGCCTCCCGTAGGAGT', 'Control', '20071210'],
    ['PC.607', 'YATGCTGCCTCCCGTAGGAGT', 'Fast', '20071112'],
    ['PC.634', 'YATGCTGCCTCCCGTAGGAGT', 'Fast', '20080116'],
    ['PC.635', 'YATGCTGCCTCCCGTAGGAGT', 'Fast', '20080116'],
    ['PC.636', 'YATGCTGCCTCCCGTAGGAGT', 'Fast', '20080116']]

MAPPING_FILE_DATA_CAT_D = [
    ['PC.354', 'AGCACGAGCCTA', 'Control', '20061218', 'Control_mouse_I.D._354'],
    ['PC.355', 'AACTCGTCGATG', 'Control', '20061218', 'Control_mouse_I.D._355'],
    ['PC.356', 'ACAGACCACTCA', 'Control', '20061126', 'Control_mouse_I.D._356'],
    ['PC.481', 'ACCAGCGACTAG', 'Control', '20070314', 'Control_mouse_I.D._481'],
    ['PC.593', 'AGCAGCACTTGT', 'Control', '20071210', 'Control_mouse_I.D._593'],
    ['PC.607', 'AACTGTGCGTAC', 'Fast', '20071112', 'Fasting_mouse_I.D._607'],
    ['PC.634', 'ACAGAGTCGGCT', 'Fast', '20080116', 'Fasting_mouse_I.D._634'],
    ['PC.635', 'ACCGCAGAGTCA', 'Fast', '20080116', 'Fasting_mouse_I.D._635'],
    ['PC.636', 'ACGGTGAGTGTC', 'Fast', '20080116', 'Fasting_mouse_I.D._636']]

MAPPING_FILE_DATA_CAT_E = [
    ['PC.354', 'Control', 'Control20061218'],
    ['PC.355', 'Control', 'Control20061218'],
    ['PC.356', 'Control', 'Control20061126'],
    ['PC.481', 'Control', 'Control20070314'],
    ['PC.593', 'Control', 'Control20071210'],
    ['PC.607', 'Fast', 'Fast20071112'],
    ['PC.634', 'Fast', 'Fast20080116'],
    ['PC.635', 'Fast', 'Fast20080116'],
    ['PC.636', 'Fast', 'Fast20080116']]


if __name__ == "__main__":
    main()